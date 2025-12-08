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

/**
 * Signal quality color mapping.
 *
 * @type {Record<string, string>}
 */
export const SIGNAL_QUALITY_COLORS = {
  excellent: '#22c55e',
  good: '#eab308',
  fair: '#f97316',
  poor: '#ef4444',
  unknown: '#6b7280',
};

/**
 * Congestion level color mapping.
 *
 * @type {Record<string, string>}
 */
export const CONGESTION_LEVEL_COLORS = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
  unknown: '#6b7280',
};

/**
 * Escape HTML special characters for safe DOM insertion.
 *
 * @param {*} value Raw value to escape.
 * @returns {string} Escaped HTML string.
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a status message HTML snippet.
 *
 * @param {string} message Status message text.
 * @param {{ error?: boolean }} options Rendering options.
 * @returns {string} HTML string.
 */
function renderStatus(message, { error = false } = {}) {
  const errorClass = error ? ' network-health-status--error' : '';
  return `<p class="network-health-status${errorClass}">${escapeHtml(message)}</p>`;
}

/**
 * Fetch network health summary from the API.
 *
 * @param {{ fetchImpl?: Function }} options Fetch options.
 * @returns {Promise<Object>} Network health summary data.
 */
export async function fetchNetworkHealthSummary({ fetchImpl = globalThis.fetch } = {}) {
  const fetchFn = typeof fetchImpl === 'function' ? fetchImpl : globalThis.fetch;
  const response = await fetchFn('/api/network-health', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch network health (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch signal quality data for heatmap visualization.
 *
 * @param {{ fetchImpl?: Function }} options Fetch options.
 * @returns {Promise<Array<Object>>} Signal quality data.
 */
export async function fetchSignalQuality({ fetchImpl = globalThis.fetch } = {}) {
  const fetchFn = typeof fetchImpl === 'function' ? fetchImpl : globalThis.fetch;
  const response = await fetchFn('/api/network-health/signal-quality', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch signal quality (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch channel congestion history.
 *
 * @param {{ fetchImpl?: Function, timeRange?: string }} options Fetch options.
 * @returns {Promise<Object>} Congestion history data.
 */
export async function fetchCongestionHistory({ fetchImpl = globalThis.fetch, timeRange = '1h' } = {}) {
  const fetchFn = typeof fetchImpl === 'function' ? fetchImpl : globalThis.fetch;
  const response = await fetchFn(`/api/network-health/congestion?timeRange=${encodeURIComponent(timeRange)}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch congestion history (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch node reliability scores.
 *
 * @param {{ fetchImpl?: Function, limit?: number }} options Fetch options.
 * @returns {Promise<Array<Object>>} Node reliability data.
 */
export async function fetchNodeReliability({ fetchImpl = globalThis.fetch, limit = 50 } = {}) {
  const fetchFn = typeof fetchImpl === 'function' ? fetchImpl : globalThis.fetch;
  const response = await fetchFn(`/api/network-health/reliability?limit=${limit}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch node reliability (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Render the network health summary section.
 *
 * @param {Object} summary Network health summary data.
 * @returns {string} HTML string.
 */
export function renderNetworkHealthSummary(summary) {
  if (!summary || typeof summary !== 'object') {
    return renderStatus('No network health data available.');
  }

  const healthScore = summary.health_score ?? 0;
  const activeNodes = summary.active_nodes || {};
  const channelMetrics = summary.channel_metrics || {};
  const signalDist = summary.signal_distribution || {};

  const scoreClass =
    healthScore >= 80 ? 'health-score--excellent' :
    healthScore >= 60 ? 'health-score--good' :
    healthScore >= 40 ? 'health-score--fair' : 'health-score--poor';

  const signalDistHtml = Object.entries(signalDist)
    .filter(([_, count]) => count > 0)
    .map(([quality, count]) => {
      const color = SIGNAL_QUALITY_COLORS[quality] || SIGNAL_QUALITY_COLORS.unknown;
      return `<span class="signal-dist-item" style="--signal-color: ${color}">${escapeHtml(quality)}: ${count}</span>`;
    })
    .join(' ');

  return `
    <div class="health-summary-grid">
      <div class="health-summary-card health-summary-card--score ${scoreClass}">
        <div class="health-score-value">${healthScore}</div>
        <div class="health-score-label">Health Score</div>
      </div>
      <div class="health-summary-card">
        <div class="health-metric">
          <span class="health-metric-value">${activeNodes.total ?? 0}</span>
          <span class="health-metric-label">Active Nodes (Week)</span>
        </div>
        <div class="health-metric">
          <span class="health-metric-value">${activeNodes.last_24h ?? 0}</span>
          <span class="health-metric-label">Active (24h)</span>
        </div>
        <div class="health-metric">
          <span class="health-metric-value">${activeNodes.last_1h ?? 0}</span>
          <span class="health-metric-label">Active (1h)</span>
        </div>
      </div>
      <div class="health-summary-card">
        <div class="health-metric">
          <span class="health-metric-value">${channelMetrics.avg_utilization ?? '—'}%</span>
          <span class="health-metric-label">Avg Channel Util</span>
        </div>
        <div class="health-metric">
          <span class="health-metric-value">${channelMetrics.avg_air_util_tx ?? '—'}%</span>
          <span class="health-metric-label">Avg Air Util TX</span>
        </div>
      </div>
      <div class="health-summary-card">
        <div class="health-metric">
          <span class="health-metric-label">Signal Distribution</span>
          <div class="signal-dist">${signalDistHtml || 'No data'}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render signal quality heatmap using Leaflet.
 *
 * @param {HTMLElement} container Container element for the map.
 * @param {Array<Object>} signalData Signal quality data.
 * @param {{ L?: Object }} options Leaflet instance.
 * @returns {Object|null} Leaflet map instance or null.
 */
export function renderSignalQualityMap(container, signalData, { L = globalThis.L } = {}) {
  if (!container || !L || typeof L.map !== 'function') {
    container.innerHTML = renderStatus('Map unavailable. Leaflet not loaded.');
    return null;
  }

  if (!Array.isArray(signalData) || signalData.length === 0) {
    container.innerHTML = renderStatus('No signal quality data available.');
    return null;
  }

  container.innerHTML = '';

  const map = L.map(container, { worldCopyJump: true, attributionControl: false });

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    className: 'map-tiles',
  }).addTo(map);

  const bounds = [];

  signalData.forEach(node => {
    const lat = node.latitude;
    const lon = node.longitude;
    if (lat == null || lon == null) return;

    const quality = node.quality || 'unknown';
    const color = SIGNAL_QUALITY_COLORS[quality] || SIGNAL_QUALITY_COLORS.unknown;

    const marker = L.circleMarker([lat, lon], {
      radius: 10,
      color: '#000',
      weight: 1,
      fillColor: color,
      fillOpacity: 0.7,
      opacity: 0.7,
    });

    const snrDisplay = node.snr != null ? `${node.snr.toFixed(1)} dB` : '—';
    const rssiDisplay = node.rssi != null ? `${node.rssi} dBm` : '—';
    const utilDisplay = node.channel_utilization != null ? `${node.channel_utilization.toFixed(1)}%` : '—';

    marker.bindPopup(`
      <strong>${escapeHtml(node.short_name || node.node_id || 'Unknown')}</strong><br>
      Quality: <span style="color: ${color}; font-weight: bold;">${escapeHtml(quality)}</span><br>
      SNR: ${snrDisplay}<br>
      RSSI: ${rssiDisplay}<br>
      Channel Util: ${utilDisplay}
    `);

    marker.addTo(map);
    bounds.push([lat, lon]);
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 13 });
  } else {
    map.setView([0, 0], 2);
  }

  return map;
}

/**
 * Render congestion gauge indicator.
 *
 * @param {Object} currentCongestion Current congestion metrics.
 * @returns {string} HTML string.
 */
export function renderCongestionGauge(currentCongestion) {
  if (!currentCongestion || typeof currentCongestion !== 'object') {
    return renderStatus('No congestion data available.');
  }

  const utilization = currentCongestion.channel_utilization ?? 0;
  const airUtil = currentCongestion.air_util_tx ?? 0;
  const level = currentCongestion.congestion_level || 'unknown';
  const color = CONGESTION_LEVEL_COLORS[level] || CONGESTION_LEVEL_COLORS.unknown;

  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);

  return `
    <div class="congestion-gauge">
      <div class="congestion-gauge__indicator" style="--congestion-color: ${color}; --congestion-value: ${utilization}%;">
        <div class="congestion-gauge__fill"></div>
        <div class="congestion-gauge__value">${utilization}%</div>
      </div>
      <div class="congestion-gauge__label">
        Channel Utilization
        <span class="congestion-level" style="color: ${color}">${levelLabel}</span>
      </div>
      <div class="congestion-gauge__secondary">
        Air Util TX: ${airUtil}%
      </div>
    </div>
  `;
}

/**
 * Render congestion history chart as SVG.
 *
 * @param {Array<Object>} buckets Congestion history buckets.
 * @param {{ width?: number, height?: number }} options Chart dimensions.
 * @returns {string} SVG HTML string.
 */
export function renderCongestionChart(buckets, { width = 600, height = 200 } = {}) {
  if (!Array.isArray(buckets) || buckets.length === 0) {
    return renderStatus('No congestion history data available.');
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxUtil = Math.max(...buckets.map(b => b.avg_channel_utilization ?? 0), 100);
  const minTimestamp = Math.min(...buckets.map(b => b.timestamp ?? 0));
  const maxTimestamp = Math.max(...buckets.map(b => b.timestamp ?? 0));
  const timeRange = maxTimestamp - minTimestamp || 1;

  const points = buckets
    .filter(b => b.timestamp != null && b.avg_channel_utilization != null)
    .map(b => {
      const x = padding.left + ((b.timestamp - minTimestamp) / timeRange) * chartWidth;
      const y = padding.top + chartHeight - (b.avg_channel_utilization / maxUtil) * chartHeight;
      return { x, y, value: b.avg_channel_utilization, timestamp: b.timestamp };
    });

  if (points.length === 0) {
    return renderStatus('Insufficient data for chart.');
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;

  const gridLines = [0, 25, 50, 75, 100]
    .filter(v => v <= maxUtil)
    .map(v => {
      const y = padding.top + chartHeight - (v / maxUtil) * chartHeight;
      return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#374151" stroke-width="1" stroke-dasharray="2,2" />
              <text x="${padding.left - 5}" y="${y + 4}" text-anchor="end" fill="#9ca3af" font-size="10">${v}%</text>`;
    })
    .join('\n');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="congestion-chart" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="congestionGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.1"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#congestionGradient)" />
      <path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="2" />
      ${points.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#3b82f6" />`).join('\n')}
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" fill="#9ca3af" font-size="11">Time</text>
      <text x="12" y="${height / 2}" text-anchor="middle" fill="#9ca3af" font-size="11" transform="rotate(-90, 12, ${height / 2})">Channel Util %</text>
    </svg>
  `;
}

/**
 * Render node reliability ranking table.
 *
 * @param {Array<Object>} nodes Node reliability data.
 * @returns {string} HTML string.
 */
export function renderReliabilityTable(nodes) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return renderStatus('No reliability data available.');
  }

  const rows = nodes.slice(0, 25).map((node, index) => {
    const score = node.reliability_score ?? 0;
    const uptime = node.uptime_percentage ?? 0;
    const stability = node.connection_stability || 'unknown';
    const stabilityColor = SIGNAL_QUALITY_COLORS[stability] || SIGNAL_QUALITY_COLORS.unknown;

    const scoreClass =
      score >= 80 ? 'reliability-score--excellent' :
      score >= 60 ? 'reliability-score--good' :
      score >= 40 ? 'reliability-score--fair' : 'reliability-score--poor';

    return `
      <tr class="reliability-row">
        <td class="reliability-rank">${index + 1}</td>
        <td class="reliability-node">
          <span class="reliability-node__name">${escapeHtml(node.short_name || node.node_id || 'Unknown')}</span>
          <span class="reliability-node__id">${escapeHtml(node.node_id || '')}</span>
        </td>
        <td class="reliability-score ${scoreClass}">${score}</td>
        <td class="reliability-uptime">${uptime.toFixed(1)}%</td>
        <td class="reliability-stability" style="color: ${stabilityColor}">${escapeHtml(stability)}</td>
        <td class="reliability-role">${escapeHtml(node.role || 'CLIENT')}</td>
      </tr>
    `;
  }).join('\n');

  return `
    <table class="reliability-table">
      <thead>
        <tr>
          <th class="reliability-header reliability-header--rank">#</th>
          <th class="reliability-header reliability-header--node">Node</th>
          <th class="reliability-header reliability-header--score">Score</th>
          <th class="reliability-header reliability-header--uptime">Uptime</th>
          <th class="reliability-header reliability-header--stability">Stability</th>
          <th class="reliability-header reliability-header--role">Role</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Initialize the network health dashboard page.
 *
 * @param {{ document?: Document, rootId?: string, fetchImpl?: Function, L?: Object }} options Initialization options.
 * @returns {Promise<boolean>} Whether initialization succeeded.
 */
export async function initializeNetworkHealthPage(options = {}) {
  const documentRef = options.document ?? globalThis.document;
  if (!documentRef || typeof documentRef.getElementById !== 'function') {
    throw new TypeError('A document with getElementById support is required');
  }

  const rootId = options.rootId ?? 'networkHealthPage';
  const container = documentRef.getElementById(rootId);
  if (!container) {
    return false;
  }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const L = options.L ?? globalThis.L;

  const summaryContainer = documentRef.getElementById('networkHealthSummary');
  const signalMapContainer = documentRef.getElementById('signalQualityMap');
  const congestionGaugeContainer = documentRef.getElementById('congestionGauge');
  const congestionChartContainer = documentRef.getElementById('congestionChart');
  const reliabilityContainer = documentRef.getElementById('reliabilityTable');
  const timeRangeSelect = documentRef.getElementById('congestionTimeRange');

  let signalMap = null;

  /**
   * Load and render the network health summary.
   *
   * @returns {Promise<void>}
   */
  async function loadSummary() {
    if (!summaryContainer) return;
    try {
      summaryContainer.innerHTML = renderStatus('Loading network health summary...');
      const summary = await fetchNetworkHealthSummary({ fetchImpl });
      summaryContainer.innerHTML = renderNetworkHealthSummary(summary);
    } catch (error) {
      console.error('Failed to load network health summary', error);
      summaryContainer.innerHTML = renderStatus('Failed to load network health summary.', { error: true });
    }
  }

  /**
   * Load and render the signal quality heatmap.
   *
   * @returns {Promise<void>}
   */
  async function loadSignalQuality() {
    if (!signalMapContainer) return;
    try {
      signalMapContainer.innerHTML = renderStatus('Loading signal quality data...');
      const signalData = await fetchSignalQuality({ fetchImpl });
      if (signalMap && typeof signalMap.remove === 'function') {
        signalMap.remove();
      }
      signalMap = renderSignalQualityMap(signalMapContainer, signalData, { L });
    } catch (error) {
      console.error('Failed to load signal quality', error);
      signalMapContainer.innerHTML = renderStatus('Failed to load signal quality data.', { error: true });
    }
  }

  /**
   * Load and render congestion data.
   *
   * @param {string} timeRange Time range for congestion history.
   * @returns {Promise<void>}
   */
  async function loadCongestion(timeRange = '1h') {
    try {
      if (congestionGaugeContainer) {
        congestionGaugeContainer.innerHTML = renderStatus('Loading congestion data...');
      }
      if (congestionChartContainer) {
        congestionChartContainer.innerHTML = renderStatus('Loading congestion history...');
      }

      const congestionData = await fetchCongestionHistory({ fetchImpl, timeRange });

      if (congestionGaugeContainer) {
        congestionGaugeContainer.innerHTML = renderCongestionGauge(congestionData.current);
      }
      if (congestionChartContainer) {
        congestionChartContainer.innerHTML = renderCongestionChart(congestionData.buckets || []);
      }
    } catch (error) {
      console.error('Failed to load congestion data', error);
      if (congestionGaugeContainer) {
        congestionGaugeContainer.innerHTML = renderStatus('Failed to load congestion data.', { error: true });
      }
      if (congestionChartContainer) {
        congestionChartContainer.innerHTML = renderStatus('Failed to load congestion history.', { error: true });
      }
    }
  }

  /**
   * Load and render node reliability scores.
   *
   * @returns {Promise<void>}
   */
  async function loadReliability() {
    if (!reliabilityContainer) return;
    try {
      reliabilityContainer.innerHTML = renderStatus('Loading reliability data...');
      const reliabilityData = await fetchNodeReliability({ fetchImpl });
      reliabilityContainer.innerHTML = renderReliabilityTable(reliabilityData);
    } catch (error) {
      console.error('Failed to load reliability data', error);
      reliabilityContainer.innerHTML = renderStatus('Failed to load reliability data.', { error: true });
    }
  }

  // Set up time range selector event handler
  if (timeRangeSelect) {
    timeRangeSelect.addEventListener('change', () => {
      const selectedRange = timeRangeSelect.value || '1h';
      loadCongestion(selectedRange);
    });
  }

  // Load all sections in parallel
  await Promise.all([
    loadSummary(),
    loadSignalQuality(),
    loadCongestion('1h'),
    loadReliability(),
  ]);

  return true;
}
