/*
 * Copyright © 2025-26 l5yth & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SIGNAL_QUALITY_COLORS,
  CONGESTION_LEVEL_COLORS,
  fetchNetworkHealthSummary,
  fetchSignalQuality,
  fetchCongestionHistory,
  fetchNodeReliability,
  renderNetworkHealthSummary,
  renderCongestionGauge,
  renderCongestionChart,
  renderReliabilityTable,
  initializeNetworkHealthPage,
} from '../network-health.js';

function createResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
  };
}

test('SIGNAL_QUALITY_COLORS contains expected quality levels', () => {
  assert.equal(typeof SIGNAL_QUALITY_COLORS.excellent, 'string');
  assert.equal(typeof SIGNAL_QUALITY_COLORS.good, 'string');
  assert.equal(typeof SIGNAL_QUALITY_COLORS.fair, 'string');
  assert.equal(typeof SIGNAL_QUALITY_COLORS.poor, 'string');
  assert.equal(typeof SIGNAL_QUALITY_COLORS.unknown, 'string');
});

test('CONGESTION_LEVEL_COLORS contains expected congestion levels', () => {
  assert.equal(typeof CONGESTION_LEVEL_COLORS.low, 'string');
  assert.equal(typeof CONGESTION_LEVEL_COLORS.moderate, 'string');
  assert.equal(typeof CONGESTION_LEVEL_COLORS.high, 'string');
  assert.equal(typeof CONGESTION_LEVEL_COLORS.critical, 'string');
  assert.equal(typeof CONGESTION_LEVEL_COLORS.unknown, 'string');
});

test('fetchNetworkHealthSummary requests the correct endpoint', async () => {
  const requests = [];
  const fetchImpl = async url => {
    requests.push(url);
    return createResponse(200, {
      health_score: 75,
      active_nodes: { total: 10, last_24h: 8, last_1h: 5 },
    });
  };
  const result = await fetchNetworkHealthSummary({ fetchImpl });
  assert.equal(requests.length, 1);
  assert.equal(requests[0], '/api/network-health');
  assert.equal(result.health_score, 75);
});

test('fetchNetworkHealthSummary throws on non-OK response', async () => {
  const fetchImpl = async () => createResponse(500, {});
  await assert.rejects(
    () => fetchNetworkHealthSummary({ fetchImpl }),
    /Failed to fetch network health/,
  );
});

test('fetchSignalQuality requests the correct endpoint', async () => {
  const requests = [];
  const fetchImpl = async url => {
    requests.push(url);
    return createResponse(200, [
      { node_id: '!abc123', quality: 'good', snr: 7.5 },
    ]);
  };
  const result = await fetchSignalQuality({ fetchImpl });
  assert.equal(requests[0], '/api/network-health/signal-quality');
  assert.equal(result.length, 1);
  assert.equal(result[0].quality, 'good');
});

test('fetchCongestionHistory includes time range parameter', async () => {
  const requests = [];
  const fetchImpl = async url => {
    requests.push(url);
    return createResponse(200, {
      time_range: '24h',
      buckets: [],
    });
  };
  await fetchCongestionHistory({ fetchImpl, timeRange: '24h' });
  assert.equal(requests[0], '/api/network-health/congestion?timeRange=24h');
});

test('fetchNodeReliability includes limit parameter', async () => {
  const requests = [];
  const fetchImpl = async url => {
    requests.push(url);
    return createResponse(200, []);
  };
  await fetchNodeReliability({ fetchImpl, limit: 25 });
  assert.equal(requests[0], '/api/network-health/reliability?limit=25');
});

test('renderNetworkHealthSummary returns HTML with health score', () => {
  const summary = {
    health_score: 85,
    active_nodes: { total: 20, last_24h: 15, last_1h: 10 },
    channel_metrics: { avg_utilization: 25.5, avg_air_util_tx: 12.3 },
    signal_distribution: { excellent: 10, good: 5, fair: 3, poor: 2, unknown: 0 },
  };
  const html = renderNetworkHealthSummary(summary);
  assert.equal(html.includes('85'), true);
  assert.equal(html.includes('Health Score'), true);
  assert.equal(html.includes('20'), true);
  assert.equal(html.includes('15'), true);
  assert.equal(html.includes('25.5'), true);
});

test('renderNetworkHealthSummary handles null or invalid input', () => {
  const html1 = renderNetworkHealthSummary(null);
  assert.equal(html1.includes('No network health data'), true);

  const html2 = renderNetworkHealthSummary({});
  assert.equal(html2.includes('health-summary-grid'), true);
});

test('renderCongestionGauge shows utilization and level', () => {
  const current = {
    channel_utilization: 45.5,
    air_util_tx: 20.3,
    congestion_level: 'moderate',
  };
  const html = renderCongestionGauge(current);
  assert.equal(html.includes('45.5%'), true);
  assert.equal(html.includes('Moderate'), true);
  assert.equal(html.includes('20.3%'), true);
});

test('renderCongestionGauge handles missing data', () => {
  const html = renderCongestionGauge(null);
  assert.equal(html.includes('No congestion data'), true);
});

test('renderCongestionChart creates SVG with data points', () => {
  const buckets = [
    { timestamp: 1700000000, avg_channel_utilization: 20 },
    { timestamp: 1700003600, avg_channel_utilization: 35 },
    { timestamp: 1700007200, avg_channel_utilization: 25 },
  ];
  const html = renderCongestionChart(buckets);
  assert.equal(html.includes('<svg'), true);
  assert.equal(html.includes('congestion-chart'), true);
  assert.equal(html.includes('<path'), true);
  assert.equal(html.includes('<circle'), true);
});

test('renderCongestionChart handles empty buckets', () => {
  const html = renderCongestionChart([]);
  assert.equal(html.includes('No congestion history'), true);
});

test('renderReliabilityTable creates table with node rows', () => {
  const nodes = [
    {
      node_id: '!abc123',
      short_name: 'TEST',
      reliability_score: 92,
      uptime_percentage: 95.5,
      connection_stability: 'excellent',
      role: 'ROUTER',
    },
    {
      node_id: '!def456',
      short_name: 'NODE2',
      reliability_score: 65,
      uptime_percentage: 70.2,
      connection_stability: 'good',
      role: 'CLIENT',
    },
  ];
  const html = renderReliabilityTable(nodes);
  assert.equal(html.includes('<table'), true);
  assert.equal(html.includes('reliability-table'), true);
  assert.equal(html.includes('TEST'), true);
  assert.equal(html.includes('92'), true);
  assert.equal(html.includes('NODE2'), true);
  assert.equal(html.includes('ROUTER'), true);
});

test('renderReliabilityTable handles empty array', () => {
  const html = renderReliabilityTable([]);
  assert.equal(html.includes('No reliability data'), true);
});

test('initializeNetworkHealthPage requires valid document', async () => {
  await assert.rejects(
    () => initializeNetworkHealthPage({ document: {} }),
    /getElementById/,
  );
});

test('initializeNetworkHealthPage returns false when container not found', async () => {
  const documentStub = {
    getElementById() {
      return null;
    },
  };
  const result = await initializeNetworkHealthPage({ document: documentStub });
  assert.equal(result, false);
});

test('initializeNetworkHealthPage loads and renders all sections', async () => {
  const containers = {
    networkHealthPage: { innerHTML: '' },
    networkHealthSummary: { innerHTML: '' },
    signalQualityMap: { innerHTML: '' },
    congestionGauge: { innerHTML: '' },
    congestionChart: { innerHTML: '' },
    reliabilityTable: { innerHTML: '' },
    congestionTimeRange: {
      value: '1h',
      addEventListener: () => {},
    },
  };
  const documentStub = {
    getElementById(id) {
      return containers[id] || null;
    },
  };

  const fetchCalls = [];
  const fetchImpl = async url => {
    fetchCalls.push(url);
    if (url === '/api/network-health') {
      return createResponse(200, {
        health_score: 80,
        active_nodes: { total: 5 },
        channel_metrics: {},
        signal_distribution: {},
      });
    }
    if (url === '/api/network-health/signal-quality') {
      return createResponse(200, []);
    }
    if (url.startsWith('/api/network-health/congestion')) {
      return createResponse(200, { current: {}, buckets: [] });
    }
    if (url.startsWith('/api/network-health/reliability')) {
      return createResponse(200, []);
    }
    return createResponse(404, {});
  };

  const result = await initializeNetworkHealthPage({
    document: documentStub,
    fetchImpl,
    L: null, // Skip map rendering
  });

  assert.equal(result, true);
  assert.equal(fetchCalls.length, 4);
  assert.equal(containers.networkHealthSummary.innerHTML.includes('80'), true);
});

test('initializeNetworkHealthPage handles fetch errors gracefully', async () => {
  const containers = {
    networkHealthPage: { innerHTML: '' },
    networkHealthSummary: { innerHTML: '' },
    signalQualityMap: { innerHTML: '' },
    congestionGauge: { innerHTML: '' },
    congestionChart: { innerHTML: '' },
    reliabilityTable: { innerHTML: '' },
    congestionTimeRange: {
      value: '1h',
      addEventListener: () => {},
    },
  };
  const documentStub = {
    getElementById(id) {
      return containers[id] || null;
    },
  };

  const fetchImpl = async () => {
    throw new Error('Network error');
  };

  const result = await initializeNetworkHealthPage({
    document: documentStub,
    fetchImpl,
    L: null,
  });

  assert.equal(result, true);
  assert.equal(containers.networkHealthSummary.innerHTML.includes('Failed'), true);
  assert.equal(containers.reliabilityTable.innerHTML.includes('Failed'), true);
});
