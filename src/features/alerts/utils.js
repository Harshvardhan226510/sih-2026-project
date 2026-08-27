export const SEVERITY_CONFIG = {
  Extreme: { color: '#dc2626', bg: '#dc26261a', icon: '⚠', label: 'EXTREME', priority: 0 },
  Severe: { color: '#ea580c', bg: '#ea580c1a', icon: '🔶', label: 'SEVERE', priority: 1 },
  Moderate: { color: '#d97706', bg: '#d977061a', icon: '🔸', label: 'MODERATE', priority: 2 },
  Minor: { color: '#0284c7', bg: '#0284c71a', icon: 'ℹ', label: 'MINOR', priority: 3 },
  Unknown: { color: '#6b7280', bg: '#6b72801a', icon: '?', label: 'UNKNOWN', priority: 4 },
};
export function getSeverityConfig(severity) {
  return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Unknown;
}
export function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
export function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}