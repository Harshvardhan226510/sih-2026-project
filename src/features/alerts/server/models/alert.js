const SEVERITIES = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];
const STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'UPDATED'];
export function validateAlert(alert) {
  const errors = [];
  if (!alert.source) errors.push('source is required');
  if (!alert.sourceId) errors.push('sourceId is required');
  if (!alert.event) errors.push('event is required');
  if (!alert.issuedAt) errors.push('issuedAt is required');
  if (alert.severity && !SEVERITIES.includes(alert.severity)) {
    errors.push(`invalid severity: ${alert.severity}`);
  }
  if (alert.status && !STATUSES.includes(alert.status)) {
    errors.push(`invalid status: ${alert.status}`);
  }
  return { valid: errors.length === 0, errors };
}
export function createAlertId(source, sourceId) {
  return `${source}-${sourceId.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
}
export { SEVERITIES, STATUSES };