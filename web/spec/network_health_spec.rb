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

require "spec_helper"
require "json"

RSpec.describe "Network Health API" do
  let(:app) { Sinatra::Application }

  describe PotatoMesh::App::NetworkHealthQueries do
    let(:helper) { Class.new { extend PotatoMesh::App::NetworkHealthQueries; extend PotatoMesh::App::Helpers }.new }

    describe "#classify_signal_quality" do
      it "returns excellent for high SNR values" do
        expect(helper.classify_signal_quality(15.0, nil)).to eq("excellent")
        expect(helper.classify_signal_quality(10.0, nil)).to eq("excellent")
      end

      it "returns good for moderate SNR values" do
        expect(helper.classify_signal_quality(7.5, nil)).to eq("good")
        expect(helper.classify_signal_quality(5.0, nil)).to eq("good")
      end

      it "returns fair for low SNR values" do
        expect(helper.classify_signal_quality(2.5, nil)).to eq("fair")
        expect(helper.classify_signal_quality(0.0, nil)).to eq("fair")
      end

      it "returns poor for negative SNR values" do
        expect(helper.classify_signal_quality(-5.0, nil)).to eq("poor")
        expect(helper.classify_signal_quality(-15.0, nil)).to eq("poor")
      end

      it "returns unknown when neither SNR nor RSSI is provided" do
        expect(helper.classify_signal_quality(nil, nil)).to eq("unknown")
      end

      it "falls back to RSSI classification when SNR is not available" do
        expect(helper.classify_signal_quality(nil, -60)).to eq("excellent")
        expect(helper.classify_signal_quality(nil, -80)).to eq("good")
        expect(helper.classify_signal_quality(nil, -95)).to eq("fair")
        expect(helper.classify_signal_quality(nil, -110)).to eq("poor")
      end
    end

    describe "#calculate_health_score" do
      it "returns 0 when there are no nodes" do
        result = helper.calculate_health_score(
          total_nodes: 0,
          nodes_24h: 0,
          avg_channel_util: nil,
          signal_distribution: {},
        )
        expect(result).to eq(0)
      end

      it "calculates a high score for a healthy network" do
        result = helper.calculate_health_score(
          total_nodes: 100,
          nodes_24h: 95,
          avg_channel_util: 15.0,
          signal_distribution: { "excellent" => 60, "good" => 30, "fair" => 8, "poor" => 2, "unknown" => 0 },
        )
        expect(result).to be >= 70
        expect(result).to be <= 100
      end

      it "calculates a lower score for a congested network" do
        result = helper.calculate_health_score(
          total_nodes: 100,
          nodes_24h: 50,
          avg_channel_util: 80.0,
          signal_distribution: { "excellent" => 10, "good" => 20, "fair" => 30, "poor" => 40, "unknown" => 0 },
        )
        expect(result).to be < 50
      end

      it "handles missing channel utilization gracefully" do
        result = helper.calculate_health_score(
          total_nodes: 50,
          nodes_24h: 40,
          avg_channel_util: nil,
          signal_distribution: { "excellent" => 25, "good" => 15, "fair" => 5, "poor" => 5, "unknown" => 0 },
        )
        expect(result).to be >= 0
        expect(result).to be <= 100
      end
    end

    describe "#calculate_congestion_level" do
      it "classifies low utilization correctly" do
        expect(helper.calculate_congestion_level(10.0)).to eq("low")
        expect(helper.calculate_congestion_level(24.9)).to eq("low")
      end

      it "classifies moderate utilization correctly" do
        expect(helper.calculate_congestion_level(25.0)).to eq("moderate")
        expect(helper.calculate_congestion_level(49.9)).to eq("moderate")
      end

      it "classifies high utilization correctly" do
        expect(helper.calculate_congestion_level(50.0)).to eq("high")
        expect(helper.calculate_congestion_level(74.9)).to eq("high")
      end

      it "classifies critical utilization correctly" do
        expect(helper.calculate_congestion_level(75.0)).to eq("critical")
        expect(helper.calculate_congestion_level(100.0)).to eq("critical")
      end

      it "returns unknown for nil values" do
        expect(helper.calculate_congestion_level(nil)).to eq("unknown")
      end
    end

    describe "#calculate_reliability_metrics" do
      let(:now) { Time.now.to_i }

      it "returns default values when timestamps are missing" do
        result = helper.calculate_reliability_metrics(
          first_heard: nil,
          last_heard: nil,
          uptime_seconds: nil,
          now: now,
        )
        expect(result[:score]).to eq(0)
        expect(result[:uptime_percentage]).to eq(0.0)
        expect(result[:stability]).to eq("unknown")
      end

      it "returns new status for nodes with zero observation window" do
        result = helper.calculate_reliability_metrics(
          first_heard: now,
          last_heard: now,
          uptime_seconds: nil,
          now: now,
        )
        expect(result[:stability]).to eq("new")
      end

      it "calculates high score for recently active nodes" do
        first_heard = now - (7 * 24 * 60 * 60) # 7 days ago
        last_heard = now - 60 # 1 minute ago
        uptime = 6 * 24 * 60 * 60 # 6 days uptime

        result = helper.calculate_reliability_metrics(
          first_heard: first_heard,
          last_heard: last_heard,
          uptime_seconds: uptime,
          now: now,
        )
        expect(result[:score]).to be >= 70
        expect(%w[excellent good]).to include(result[:stability])
      end

      it "calculates lower score for nodes not recently heard" do
        first_heard = now - (7 * 24 * 60 * 60)
        last_heard = now - (2 * 24 * 60 * 60) # 2 days ago
        uptime = nil

        result = helper.calculate_reliability_metrics(
          first_heard: first_heard,
          last_heard: last_heard,
          uptime_seconds: uptime,
          now: now,
        )
        expect(result[:score]).to be < 80
      end
    end
  end

  describe "GET /api/network-health" do
    it "returns aggregated network health metrics" do
      get "/api/network-health"
      expect(last_response.status).to eq(200)
      expect(last_response.content_type).to include("application/json")

      body = JSON.parse(last_response.body)
      expect(body).to have_key("timestamp")
      expect(body).to have_key("timestamp_iso")
      expect(body).to have_key("health_score")
      expect(body).to have_key("active_nodes")
      expect(body).to have_key("channel_metrics")
      expect(body).to have_key("signal_distribution")

      expect(body["active_nodes"]).to have_key("total")
      expect(body["active_nodes"]).to have_key("last_24h")
      expect(body["active_nodes"]).to have_key("last_1h")
    end
  end

  describe "GET /api/network-health/signal-quality" do
    it "returns signal quality data for heatmap" do
      get "/api/network-health/signal-quality"
      expect(last_response.status).to eq(200)
      expect(last_response.content_type).to include("application/json")

      body = JSON.parse(last_response.body)
      expect(body).to be_an(Array)
    end
  end

  describe "GET /api/network-health/congestion" do
    it "returns congestion history with default time range" do
      get "/api/network-health/congestion"
      expect(last_response.status).to eq(200)
      expect(last_response.content_type).to include("application/json")

      body = JSON.parse(last_response.body)
      expect(body).to have_key("time_range")
      expect(body).to have_key("window_seconds")
      expect(body).to have_key("bucket_seconds")
      expect(body).to have_key("current")
      expect(body).to have_key("buckets")
      expect(body["time_range"]).to eq("1h")
    end

    it "accepts time range parameter" do
      get "/api/network-health/congestion?timeRange=24h"
      expect(last_response.status).to eq(200)

      body = JSON.parse(last_response.body)
      expect(body["time_range"]).to eq("24h")
      expect(body["window_seconds"]).to eq(86_400)
    end

    it "accepts 7 day time range" do
      get "/api/network-health/congestion?timeRange=7d"
      expect(last_response.status).to eq(200)

      body = JSON.parse(last_response.body)
      expect(body["time_range"]).to eq("7d")
      expect(body["window_seconds"]).to eq(604_800)
    end
  end

  describe "GET /api/network-health/reliability" do
    it "returns node reliability scores" do
      get "/api/network-health/reliability"
      expect(last_response.status).to eq(200)
      expect(last_response.content_type).to include("application/json")

      body = JSON.parse(last_response.body)
      expect(body).to be_an(Array)
    end

    it "respects limit parameter" do
      get "/api/network-health/reliability?limit=10"
      expect(last_response.status).to eq(200)

      body = JSON.parse(last_response.body)
      expect(body).to be_an(Array)
      expect(body.length).to be <= 10
    end
  end

  describe "GET /network-health" do
    it "renders the network health dashboard view" do
      get "/network-health"
      expect(last_response.status).to eq(200)
      expect(last_response.body).to include("network-health")
      expect(last_response.body).to include("networkHealthPage")
    end

    it "supports trailing slash" do
      get "/network-health/"
      expect(last_response.status).to eq(200)
    end
  end
end
