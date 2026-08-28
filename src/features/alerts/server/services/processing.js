/**
 * Alert Processing
 *
 * Classifies a batch of normalized alerts into:
 *   toCreate    — new alerts (no existing record with same source_id)
 *   toUpdate    — existing alerts with meaningful field changes
 *   toCancel    — existing alerts that IMD has explicitly cancelled via CAP msgType=Cancel
 *   skipped     — count of unchanged duplicates (no action needed)
 *   malformed   — count of alerts that failed validation (per-alert isolation)
 *
 * Each item in toCreate and toUpdate carries a `lifecycleEvent` string for
 * the notification router to distinguish new vs updated alerts.
 *
 * DEDUPLICATION
 * The same source_id arriving again is NOT a new alert.
 * Identity is based solely on (source, source_id) — the authoritative CAP <identifier>.
 *
 * SEVERITY ESCALATION
 * If severity changes (e.g. Severe → Extreme), hasChanged() returns true.
 * The notification router will receive eventType=alert_updated, enabling
 * appropriate re-notification to users.
 *
 * CANCELLATION
 * CAP msgType=Cancel (or Cancellation) means IMD explicitly revoked an alert.
 * These are identified by their references field and classified as toCancel.
 */

import logger from '../utils/logger.js';
import { validateAlert, ALERT_EVENTS } from '../models/alert.js';

// CAP msgType values that indicate an explicit cancellation
const CAP_CANCEL_TYPES = new Set(['Cancel', 'Cancellation']);

export function processAlerts(normalized, existingMap) {
  const results = {
    toCreate:  [],
    toUpdate:  [],
    toCancel:  [], // { alertId, sourceId } pairs to mark CANCELLED
    skipped:   0,
    malformed: 0,
  };

  for (const alert of normalized) {
    // ── Cancellation detection ─────────────────────────────────────────────────
    // A Cancel msgType targets *another* alert (identified via references).
    // Do not insert a Cancel message as a new alert; instead, cancel the referenced one.
    if (CAP_CANCEL_TYPES.has(alert.capMsgType)) {
      const referencedSourceIds = extractReferencedSourceIds(alert.capReferences);
      for (const sid of referencedSourceIds) {
        const existing = existingMap.get(sid);
        if (existing && existing.status === 'ACTIVE') {
          results.toCancel.push({ alertId: existing.id, sourceId: sid });
          logger.info(
            { cancelSourceId: sid, cancelAlertId: existing.id, cancellerSourceId: alert.sourceId },
            'cancellation_detected'
          );
        }
      }
      // The cancel message itself is NOT stored as a new alert record.
      continue;
    }

    // ── Validation ────────────────────────────────────────────────────────────
    const validation = validateAlert(alert);
    if (!validation.valid) {
      logger.warn({ id: alert.id, errors: validation.errors }, 'invalid alert skipped');
      results.malformed++;
      continue;
    }

    // ── Deduplication + change detection ──────────────────────────────────────
    const existing = existingMap.get(alert.sourceId);

    if (existing) {
      // Already in DB — check for meaningful changes
      if (hasChanged(existing, alert)) {
        // Existing alert with meaningful field changes → UPDATE
        const lifecycleEvent = ALERT_EVENTS.UPDATED;
        results.toUpdate.push({ ...alert, id: existing.id, lifecycleEvent });
        logger.info(
          { alertId: existing.id, sourceId: alert.sourceId, lifecycleEvent },
          'alert_updated'
        );
      } else {
        // No meaningful change — skip entirely, no notification
        results.skipped++;
        logger.debug(
          { alertId: existing.id, sourceId: alert.sourceId },
          'alert_unchanged'
        );
      }
    } else {
      // Not in DB — new alert
      const lifecycleEvent = ALERT_EVENTS.CREATED;
      results.toCreate.push({ ...alert, lifecycleEvent });
      logger.info(
        { alertId: alert.id, sourceId: alert.sourceId, lifecycleEvent },
        'alert_created'
      );
    }
  }

  return results;
}

/**
 * Determine whether a meaningful field has changed between the stored alert
 * and the incoming normalized alert.
 *
 * IMPORTANT: Only meaningful, user-observable fields are compared.
 * Timestamp noise (e.g. sub-second differences in issuedAt) does NOT trigger updates.
 * Severity escalation (e.g. Severe → Extreme) IS treated as a meaningful change.
 */
export function hasChanged(existing, incoming) {
  return (
    existing.severity    !== incoming.severity    ||
    existing.urgency     !== incoming.urgency     ||
    existing.certainty   !== incoming.certainty   ||
    existing.status      !== incoming.status      ||
    existing.event       !== incoming.event       ||
    existing.headline    !== incoming.headline    ||
    existing.description !== incoming.description ||
    existing.instruction !== incoming.instruction ||
    existing.effectiveAt !== incoming.effectiveAt ||
    existing.expiresAt   !== incoming.expiresAt   ||
    existing.area        !== incoming.area        ||
    existing.polygon     !== incoming.polygon
  );
}

/**
 * Extract source IDs referenced by a CAP Cancel message.
 * CAP references field: space-separated tuples of "sender,identifier,sent".
 * We extract the identifier (index 1) from each tuple.
 */
function extractReferencedSourceIds(references) {
  if (!references || typeof references !== 'string') return [];
  return references
    .trim()
    .split(/\s+/)
    .map(tuple => {
      const parts = tuple.split(',');
      return parts[1] || null; // index 1 = identifier (source_id)
    })
    .filter(Boolean);
}

// ── Legacy helpers preserved for backward compatibility ────────────────────────

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
  const now     = new Date();
  const expired = [];
  const active  = [];
  for (const alert of alerts) {
    if (alert.expiresAt && new Date(alert.expiresAt) < now && alert.status === 'ACTIVE') {
      expired.push(alert.id);
    } else {
      active.push(alert);
    }
  }
  return { expired, active };
}