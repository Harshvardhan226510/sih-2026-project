import logger from '../utils/logger.js';
import { validateAlert } from '../models/alert.js';
export function processAlerts(normalized, existingMap) {
  const results = { toCreate: [], toUpdate: [], skipped: 0 };
  for (const alert of normalized) {
    const validation = validateAlert(alert);
    if (!validation.valid) {
      logger.warn({ id: alert.id, errors: validation.errors }, 'invalid alert skipped');
      results.skipped++;
      continue;
    }
    const existing = existingMap.get(alert.sourceId);
    if (existing) {
      if (hasChanged(existing, alert)) {
        results.toUpdate.push({ ...alert, id: existing.id });
      } else {
        results.skipped++;
      }
    } else {
      results.toCreate.push(alert);
    }
  }
  return results;
}
export function classifySeverity(event, description) {
  const text = `${event} ${description}`.toLowerCase();
  if (text.includes('extremely heavy') || text.includes('cyclonic storm') || text.includes('super cyclone')) {
    return 'Extreme';
  }
  if (text.includes('very heavy') || text.includes('severe') || text.includes('flood')) {
    return 'Severe';
  }
  if (text.includes('heavy') || text.includes('heat wave') || text.includes('thunderstorm')) {
    return 'Moderate';
  }
  if (text.includes('light') || text.includes('fog') || text.includes('advisory')) {
    return 'Minor';
  }
  return 'Unknown';
}
export function checkExpired(alerts) {
  const now = new Date();
  const expired = [];
  const active = [];
  for (const alert of alerts) {
    if (alert.expiresAt && new Date(alert.expiresAt) < now && alert.status === 'ACTIVE') {
      expired.push(alert.id);
    } else {
      active.push(alert);
    }
  }
  return { expired, active };
}
function hasChanged(existing, incoming) {
  return existing.severity !== incoming.severity ||
    existing.status !== incoming.status ||
    existing.headline !== incoming.headline ||
    existing.description !== incoming.description ||
    existing.expiresAt !== incoming.expiresAt ||
    existing.area !== incoming.area;
}