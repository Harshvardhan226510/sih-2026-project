/**
 * MQTT Outbox Repository
 *
 * Manages the mqtt_outbox table — a persistent queue for MQTT publications
 * that could not be delivered because the broker was temporarily unavailable.
 *
 * FLOW:
 *   Alert persisted to DB
 *   ↓
 *   publishAlert() called
 *   ↓  (broker offline)
 *   enqueue() → status=PENDING
 *   ↓  (broker reconnects)
 *   flushOutbox() → getPending() → publish → markPublished()
 *                              └→ (error)  → markFailed()
 *
 * QoS note: all outbox entries use QoS 1 (at-least-once).
 * Subscribers must deduplicate by alertId.
 *
 * Security: payloads must never contain MQTT credentials, VAPID keys,
 * or user PII. Topic values are safe to store.
 */

import { runExec, runGet, runQuery } from '../db/connection.js';

const MAX_ATTEMPTS = 10; // after this many failures, mark FAILED (permanently, won't retry)

export class MqttOutboxRepository {
  /**
   * Enqueue a pending MQTT publication.
   * Idempotent per (alert_id, topic): will not double-enqueue the same alert to the same topic.
   */
  enqueue(alertId, topic, payload, qos = 1) {
    const now = new Date().toISOString();
    // Check for an existing PENDING entry for this alert+topic — avoid double-enqueue
    const existing = runGet(
      `SELECT id FROM mqtt_outbox WHERE alert_id = ? AND topic = ? AND status = 'PENDING'`,
      [alertId, topic]
    );
    if (existing) return; // already queued

    runExec(
      `INSERT INTO mqtt_outbox (alert_id, topic, payload, qos, status, attempts, created_at)
       VALUES (?, ?, ?, ?, 'PENDING', 0, ?)`,
      [alertId, topic, JSON.stringify(payload), qos, now]
    );
  }

  /**
   * Get all PENDING outbox entries, ordered oldest-first (FIFO).
   * @param {number} limit — max entries to return per flush cycle
   */
  getPending(limit = 50) {
    return runQuery(
      `SELECT * FROM mqtt_outbox WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT ?`,
      [limit]
    );
  }

  /**
   * Mark an outbox entry as successfully published.
   */
  markPublished(id) {
    const now = new Date().toISOString();
    runExec(
      `UPDATE mqtt_outbox
       SET status = 'PUBLISHED', published_at = ?, last_attempt_at = ?
       WHERE id = ?`,
      [now, now, id]
    );
  }

  /**
   * Record a failed publish attempt.
   * If attempts exceed MAX_ATTEMPTS, mark the entry FAILED so it is not retried indefinitely.
   */
  markFailed(id, errorMessage) {
    const now = new Date().toISOString();
    const row = runGet('SELECT attempts FROM mqtt_outbox WHERE id = ?', [id]);
    if (!row) return;

    const newAttempts = (row.attempts || 0) + 1;
    const newStatus   = newAttempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING';

    runExec(
      `UPDATE mqtt_outbox
       SET status = ?, attempts = ?, last_attempt_at = ?, last_error = ?
       WHERE id = ?`,
      [newStatus, newAttempts, now, String(errorMessage).substring(0, 500), id]
    );
  }

  /**
   * Observability: outbox queue stats for health/admin endpoints.
   * Does NOT expose to user-facing dashboard.
   */
  getStats() {
    const pending   = runGet(`SELECT COUNT(*) as count FROM mqtt_outbox WHERE status = 'PENDING'`)?.count   || 0;
    const published = runGet(`SELECT COUNT(*) as count FROM mqtt_outbox WHERE status = 'PUBLISHED'`)?.count || 0;
    const failed    = runGet(`SELECT COUNT(*) as count FROM mqtt_outbox WHERE status = 'FAILED'`)?.count    || 0;
    return { pending, published, failed };
  }
}
