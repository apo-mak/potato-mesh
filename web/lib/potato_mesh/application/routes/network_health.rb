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
    module Routes
      # Routes exposing network health metrics for the dashboard.
      module NetworkHealth
        # Register network health API endpoints.
        #
        # @param app [Sinatra::Base] application instance receiving the routes.
        # @return [void]
        def self.registered(app)
          app.get "/api/network-health" do
            content_type :json
            query_network_health_summary.to_json
          end

          app.get "/api/network-health/signal-quality" do
            content_type :json
            query_signal_quality.to_json
          end

          app.get "/api/network-health/congestion" do
            content_type :json
            time_range = params["timeRange"] || "1h"
            query_congestion_history(time_range).to_json
          end

          app.get "/api/network-health/reliability" do
            content_type :json
            limit = [params["limit"]&.to_i || 50, 100].min
            query_node_reliability(limit).to_json
          end

          app.get %r{/network-health/?} do
            render_root_view(:network_health, view_mode: :network_health)
          end
        end
      end
    end
  end
end
