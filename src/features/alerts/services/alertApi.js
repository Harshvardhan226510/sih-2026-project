const API_BASE = '/api';
const DEFAULT_TIMEOUT = 12000;
async function request(path, opts = {}) {
  const { timeout = DEFAULT_TIMEOUT, headers = {}, ...rest } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', ...headers },
      ...rest,
    });
    clearTimeout(timer);
    if (res.status === 304) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}
export function fetchAlerts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/alerts${qs ? `?${qs}` : ''}`);
}
export function fetchAlert(id) {
  return request(`/alerts/${id}`);
}
export function fetchAlertHistory(id) {
  return request(`/alerts/${id}/history`);
}
export function fetchSync(sinceRevision, etag, options = {}) {
  const headers = {};
  if (etag) headers['If-None-Match'] = etag;
  
  const params = new URLSearchParams({ since: sinceRevision });
  if (options.state) params.append('state', options.state);
  if (options.district) params.append('district', options.district);
  if (options.networkProfile) params.append('networkProfile', options.networkProfile);
  if (options.deviceId) params.append('deviceId', options.deviceId);
  
  return request(`/alerts/sync?${params.toString()}`, { headers });
}
export function fetchBootstrap() {
  return request('/alerts/bootstrap');
}
export function fetchSummary(etag) {
  const headers = {};
  if (etag) headers['If-None-Match'] = etag;
  return request('/alerts/summary', { headers });
}
export function fetchHealth() {
  return request('/health', { timeout: 5000 });
}
export function triggerIngestion() {
  return request('/alerts/ingest', { method: 'POST' });
}
export function registerDevice(deviceId, state, district) {
  return request('/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, state, district })
  });
}
export function updateDeviceLocation(deviceId, latitude, longitude, accuracy) {
  return request('/devices/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, latitude, longitude, accuracy })
  });
}
export function acknowledgeAlert(deviceId, alertId) {
  return request('/alerts/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, alertId })
  });
}