# Copyright © 2025-26 l5yth & contributors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# frozen_string_literal: true

module PotatoMesh
  module App
    # Query helpers for network health metrics.
    module NetworkHealthQueries
      # Time window mappings for congestion history queries.
      TIME_RANGES = {
        "1h" => 3_600,
        "24h" => 86_400,
        "7d" => 604_800,
      }.freeze

      # Signal quality thresholds for classification.
      SIGNAL_THRESHOLDS = {
        excellent: { snr_min: 10.0, rssi_min: -70 },
        good: { snr_min: 5.0, rssi_min: -85 },
        fair: { snr_min: 0.0, rssi_min: -100 },
        poor: { snr_min: -10.0, rssi_min: -120 },
      }.freeze

      # Classify signal quality based on SNR and RSSI values.
      #
      # @param snr [Float, nil] Signal-to-noise ratio.
      # @param rssi [Integer, nil] Received signal strength indicator.
      # @return [String] Signal quality classification.
      def classify_signal_quality(snr, rssi)
        snr_val = coerce_float(snr)
        rssi_val = coerce_integer(rssi)

        return "unknown" unless snr_val || rssi_val

        if snr_val
          return "excellent" if snr_val >= SIGNAL_THRESHOLDS[:excellent][:snr_min]
          return "good" if snr_val >= SIGNAL_THRESHOLDS[:good][:snr_min]
          return "fair" if snr_val >= SIGNAL_THRESHOLDS[:fair][:snr_min]

          return "poor"
        end

        if rssi_val
          return "excellent" if rssi_val >= SIGNAL_THRESHOLDS[:excellent][:rssi_min]
          return "good" if rssi_val >= SIGNAL_THRESHOLDS[:good][:rssi_min]
          return "fair" if rssi_val >= SIGNAL_THRESHOLDS[:fair][:rssi_min]

          return "poor"
        end

        "unknown"
      end

      # Fetch aggregated network health summary.
      #
      # @return [Hash] Network health summary with metrics.
      def query_network_health_summary
        db = open_database(readonly: true)
        db.results_as_hash = true
        now = Time.now.to_i
        week_ago = now - PotatoMesh::Config.week_seconds
        day_ago = now - 86_400
        hour_ago = now - 3_600

        # Active node counts
        total_nodes = db.get_first_value(
          "SELECT COUNT(*) FROM nodes WHERE last_heard >= ?",
          [week_ago],
        ).to_i

        nodes_24h = db.get_first_value(
          "SELECT COUNT(*) FROM nodes WHERE last_heard >= ?",
          [day_ago],
        ).to_i

        nodes_1h = db.get_first_value(
          "SELECT COUNT(*) FROM nodes WHERE last_heard >= ?",
          [hour_ago],
        ).to_i

        # Average channel utilization from recent telemetry
        avg_channel_util = db.get_first_value(
          "SELECT AVG(channel_utilization) FROM telemetry WHERE rx_time >= ? AND channel_utilization IS NOT NULL",
          [hour_ago],
        )
        avg_channel_util = coerce_float(avg_channel_util)

        avg_air_util = db.get_first_value(
          "SELECT AVG(air_util_tx) FROM telemetry WHERE rx_time >= ? AND air_util_tx IS NOT NULL",
          [hour_ago],
        )
        avg_air_util = coerce_float(avg_air_util)

        # Signal quality distribution
        signal_distribution = { "excellent" => 0, "good" => 0, "fair" => 0, "poor" => 0, "unknown" => 0 }
        snr_rows = db.execute(
          "SELECT snr FROM nodes WHERE last_heard >= ? AND snr IS NOT NULL",
          [week_ago],
        )
        snr_rows.each do |row|
          quality = classify_signal_quality(row["snr"], nil)
          signal_distribution[quality] += 1
        end

        # Network health score (0-100)
        health_score = calculate_health_score(
          total_nodes: total_nodes,
          nodes_24h: nodes_24h,
          avg_channel_util: avg_channel_util,
          signal_distribution: signal_distribution,
        )

        {
          "timestamp" => now,
          "timestamp_iso" => Time.at(now).utc.iso8601,
          "health_score" => health_score,
          "active_nodes" => {
            "total" => total_nodes,
            "last_24h" => nodes_24h,
            "last_1h" => nodes_1h,
          },
          "channel_metrics" => {
            "avg_utilization" => avg_channel_util&.round(2),
            "avg_air_util_tx" => avg_air_util&.round(2),
          },
          "signal_distribution" => signal_distribution,
        }
      ensure
        db&.close
      end

      # Calculate overall network health score.
      #
      # @param total_nodes [Integer] Total active nodes.
      # @param nodes_24h [Integer] Nodes active in last 24 hours.
      # @param avg_channel_util [Float, nil] Average channel utilization.
      # @param signal_distribution [Hash] Signal quality counts.
      # @return [Integer] Health score from 0 to 100.
      def calculate_health_score(total_nodes:, nodes_24h:, avg_channel_util:, signal_distribution:)
        return 0 if total_nodes.zero?

        # Activity score (30 points max)
        activity_ratio = nodes_24h.to_f / total_nodes
        activity_score = (activity_ratio * 30).round

        # Channel utilization score (30 points max, lower is better)
        channel_score = if avg_channel_util.nil?
            15 # Neutral when no data
          elsif avg_channel_util < 25
            30
          elsif avg_channel_util < 50
            20
          elsif avg_channel_util < 75
            10
          else
            0
          end

        # Signal quality score (40 points max)
        total_signals = signal_distribution.values.sum.to_f
        if total_signals.positive?
          excellent_ratio = signal_distribution["excellent"].to_f / total_signals
          good_ratio = signal_distribution["good"].to_f / total_signals
          fair_ratio = signal_distribution["fair"].to_f / total_signals

          signal_score = ((excellent_ratio * 40) +
                          (good_ratio * 30) +
                          (fair_ratio * 15)).round
        else
          signal_score = 20 # Neutral when no data
        end

        [activity_score + channel_score + signal_score, 100].min
      end

      # Fetch signal quality data for heatmap visualization.
      #
      # @return [Array<Hash>] Array of nodes with signal quality data and positions.
      def query_signal_quality
        db = open_database(readonly: true)
        db.results_as_hash = true
        now = Time.now.to_i
        week_ago = now - PotatoMesh::Config.week_seconds

        sql = <<~SQL
          SELECT
            n.node_id,
            n.short_name,
            n.long_name,
            n.latitude,
            n.longitude,
            n.snr,
            n.last_heard,
            t.rssi,
            t.channel_utilization,
            t.air_util_tx
          FROM nodes n
          LEFT JOIN (
            SELECT node_id, rssi, channel_utilization, air_util_tx
            FROM telemetry
            WHERE rx_time >= ?
            GROUP BY node_id
            HAVING rx_time = MAX(rx_time)
          ) t ON n.node_id = t.node_id
          WHERE n.last_heard >= ?
            AND n.latitude IS NOT NULL
            AND n.longitude IS NOT NULL
          ORDER BY n.last_heard DESC
          LIMIT 500
        SQL

        rows = db.execute(sql, [week_ago, week_ago])
        rows.map do |row|
          snr = coerce_float(row["snr"])
          rssi = coerce_integer(row["rssi"])
          quality = classify_signal_quality(snr, rssi)

          compact_api_row({
            "node_id" => row["node_id"],
            "short_name" => row["short_name"],
            "long_name" => row["long_name"],
            "latitude" => coerce_float(row["latitude"]),
            "longitude" => coerce_float(row["longitude"]),
            "snr" => snr,
            "rssi" => rssi,
            "channel_utilization" => coerce_float(row["channel_utilization"]),
            "air_util_tx" => coerce_float(row["air_util_tx"]),
            "quality" => quality,
            "last_heard" => coerce_integer(row["last_heard"]),
          })
        end
      ensure
        db&.close
      end

      # Fetch channel congestion history for the specified time range.
      #
      # @param time_range [String] Time range identifier (1h, 24h, 7d).
      # @return [Hash] Congestion history with buckets and current metrics.
      def query_congestion_history(time_range)
        db = open_database(readonly: true)
        db.results_as_hash = true
        now = Time.now.to_i

        window_seconds = TIME_RANGES[time_range] || TIME_RANGES["1h"]
        min_timestamp = now - window_seconds

        # Determine bucket size based on time range
        bucket_seconds = case time_range
          when "7d"
            3_600 # 1 hour buckets
          when "24h"
            900 # 15 minute buckets
          else
            60 # 1 minute buckets
          end

        bucket_expression = "((rx_time / ?) * ?)"

        sql = <<~SQL
          SELECT
            #{bucket_expression} AS bucket_start,
            COUNT(*) AS sample_count,
            AVG(channel_utilization) AS avg_channel_utilization,
            MAX(channel_utilization) AS max_channel_utilization,
            AVG(air_util_tx) AS avg_air_util_tx,
            MAX(air_util_tx) AS max_air_util_tx
          FROM telemetry
          WHERE rx_time >= ?
            AND (channel_utilization IS NOT NULL OR air_util_tx IS NOT NULL)
          GROUP BY bucket_start
          ORDER BY bucket_start ASC
          LIMIT 1000
        SQL

        params = [bucket_seconds, bucket_seconds, min_timestamp]
        buckets = db.execute(sql, params).map do |row|
          bucket_start = coerce_integer(row["bucket_start"])
          {
            "timestamp" => bucket_start,
            "timestamp_iso" => bucket_start ? Time.at(bucket_start).utc.iso8601 : nil,
            "sample_count" => coerce_integer(row["sample_count"]),
            "avg_channel_utilization" => coerce_float(row["avg_channel_utilization"])&.round(2),
            "max_channel_utilization" => coerce_float(row["max_channel_utilization"])&.round(2),
            "avg_air_util_tx" => coerce_float(row["avg_air_util_tx"])&.round(2),
            "max_air_util_tx" => coerce_float(row["max_air_util_tx"])&.round(2),
          }
        end

        # Current congestion metrics
        hour_ago = now - 3_600
        current_util = db.get_first_value(
          "SELECT AVG(channel_utilization) FROM telemetry WHERE rx_time >= ? AND channel_utilization IS NOT NULL",
          [hour_ago],
        )
        current_air = db.get_first_value(
          "SELECT AVG(air_util_tx) FROM telemetry WHERE rx_time >= ? AND air_util_tx IS NOT NULL",
          [hour_ago],
        )

        {
          "time_range" => time_range,
          "window_seconds" => window_seconds,
          "bucket_seconds" => bucket_seconds,
          "current" => {
            "channel_utilization" => coerce_float(current_util)&.round(2),
            "air_util_tx" => coerce_float(current_air)&.round(2),
            "congestion_level" => calculate_congestion_level(coerce_float(current_util)),
          },
          "buckets" => buckets,
        }
      ensure
        db&.close
      end

      # Calculate congestion level from utilization percentage.
      #
      # @param utilization [Float, nil] Channel utilization percentage.
      # @return [String] Congestion level (low, moderate, high, critical).
      def calculate_congestion_level(utilization)
        return "unknown" if utilization.nil?
        return "low" if utilization < 25
        return "moderate" if utilization < 50
        return "high" if utilization < 75

        "critical"
      end

      # Fetch node reliability scores based on last_heard patterns.
      #
      # @param limit [Integer] Maximum number of results.
      # @return [Array<Hash>] Array of nodes with reliability metrics.
      def query_node_reliability(limit)
        db = open_database(readonly: true)
        db.results_as_hash = true
        now = Time.now.to_i
        week_ago = now - PotatoMesh::Config.week_seconds

        sql = <<~SQL
          SELECT
            node_id,
            short_name,
            long_name,
            hw_model,
            role,
            last_heard,
            first_heard,
            uptime_seconds
          FROM nodes
          WHERE last_heard >= ?
            AND first_heard IS NOT NULL
          ORDER BY last_heard DESC
          LIMIT ?
        SQL

        rows = db.execute(sql, [week_ago, [limit, 100].min])

        results = rows.map do |row|
          first_heard = coerce_integer(row["first_heard"])
          last_heard = coerce_integer(row["last_heard"])
          uptime = coerce_integer(row["uptime_seconds"])

          reliability = calculate_reliability_metrics(
            first_heard: first_heard,
            last_heard: last_heard,
            uptime_seconds: uptime,
            now: now,
          )

          compact_api_row({
            "node_id" => row["node_id"],
            "short_name" => row["short_name"],
            "long_name" => row["long_name"],
            "hw_model" => row["hw_model"],
            "role" => row["role"] || "CLIENT",
            "last_heard" => last_heard,
            "last_heard_iso" => last_heard ? Time.at(last_heard).utc.iso8601 : nil,
            "first_heard" => first_heard,
            "uptime_seconds" => uptime,
            "reliability_score" => reliability[:score],
            "uptime_percentage" => reliability[:uptime_percentage],
            "connection_stability" => reliability[:stability],
          })
        end

        # Sort by reliability score descending
        results.sort_by { |r| -(r["reliability_score"] || 0) }
      ensure
        db&.close
      end

      # Calculate reliability metrics for a node.
      #
      # @param first_heard [Integer, nil] First heard timestamp.
      # @param last_heard [Integer, nil] Last heard timestamp.
      # @param uptime_seconds [Integer, nil] Device uptime.
      # @param now [Integer] Current timestamp.
      # @return [Hash] Reliability metrics.
      def calculate_reliability_metrics(first_heard:, last_heard:, uptime_seconds:, now:)
        return { score: 0, uptime_percentage: 0.0, stability: "unknown" } unless first_heard && last_heard

        # Calculate time span the node has been known
        observation_window = now - first_heard
        return { score: 0, uptime_percentage: 0.0, stability: "new" } if observation_window <= 0

        # Recency score (how recently was the node heard)
        time_since_heard = now - last_heard
        recency_score = if time_since_heard < 300 # 5 minutes
            100
          elsif time_since_heard < 900 # 15 minutes
            80
          elsif time_since_heard < 3_600 # 1 hour
            60
          elsif time_since_heard < 86_400 # 1 day
            40
          else
            20
          end

        # Calculate uptime percentage
        uptime_percentage = if uptime_seconds && uptime_seconds.positive?
            # If we have actual uptime from the device
            effective_window = [observation_window, PotatoMesh::Config.week_seconds].min
            [(uptime_seconds.to_f / effective_window) * 100, 100.0].min
          else
            # Estimate based on observation
            [(last_heard - first_heard).to_f / observation_window * 100, 100.0].min
          end

        # Stability classification
        stability = if uptime_percentage >= 90 && recency_score >= 80
            "excellent"
          elsif uptime_percentage >= 70 && recency_score >= 60
            "good"
          elsif uptime_percentage >= 50 && recency_score >= 40
            "fair"
          else
            "poor"
          end

        # Overall reliability score (weighted average)
        score = ((recency_score * 0.6) + (uptime_percentage * 0.4)).round

        {
          score: score,
          uptime_percentage: uptime_percentage.round(2),
          stability: stability,
        }
      end
    end
  end
end
