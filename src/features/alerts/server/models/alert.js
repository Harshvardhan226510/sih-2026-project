/**
 * Alert Model
 *
 * Defines the canonical status values, severity order, and alert event types
 * used throughout the alert pipeline.
 *
 * ALERT LIFECYCLE
 * ──────────────
 * DB status values (stored in alerts.status):
 *   ACTIVE    — Alert is valid and currently in effect.
 *   EXPIRED   — alert.expires_at < now; no longer in effect.
 *   CANCELLED — IMD explicitly cancelled this alert via CAP msgType=Cancel.
 *   UPDATED   — Reserved for future use; current pipeline keeps ACTIVE on update
 *               and records the change in alert_revisions with action='updated'.
 *
 * Lifecycle event types (used for routing/logging; NOT stored in DB):
 *   alert_created   — First time this source_id is seen.
 *   alert_updated   — Existing alert with meaningful field changes.
 *   alert_unchanged — Same source_id, no meaningful changes. Do NOT notify.
 *   alert_expired   — Transition from ACTIVE → EXPIRED (time-based).
 *   alert_cancelled — IMD explicitly cancelled via CAP msgType=Cancel.
 *
 * SEVERITY ORDER (descending severity)
 * ──────────────
 *   Extreme > Severe > Moderate > Minor > Unknown
 *
 * IDENTITY
 * ────────
 * An alert is uniquely identified by (source, source_id).
 * source_id is the CAP <identifier> field — the authoritative IMD identifier.
 * The composite DB primary key is createAlertId(source, sourceId).
 */

const SEVERITIES = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];

/**
 * DB-level status values — stored in alerts.status.
 * Kept backward-compatible with existing clients.
 */
const STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'UPDATED'];

/**
 * Lifecycle event types — used for routing decisions and logging only.
 * These are NEVER stored directly in alerts.status.
 */
const ALERT_EVENTS = {
  CREATED:   'alert_created',
  UPDATED:   'alert_updated',
  UNCHANGED: 'alert_unchanged',
  EXPIRED:   'alert_expired',
  CANCELLED: 'alert_cancelled',
};

export function validateAlert(alert) {
  const errors = [];
  if (!alert.source)   errors.push('source is required');
  if (!alert.sourceId) errors.push('sourceId is required');
  if (!alert.event)    errors.push('event is required');
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

/**
 * Returns true if severity A is strictly higher than severity B.
 * Used to detect severity escalation (e.g. SEVERE → EXTREME).
 */
export function isSeverityEscalation(from, to) {
  const fromIdx = SEVERITIES.indexOf(from);
  const toIdx   = SEVERITIES.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx < fromIdx; // lower index = higher severity in the SEVERITIES array
}

export { SEVERITIES, STATUSES, ALERT_EVENTS };