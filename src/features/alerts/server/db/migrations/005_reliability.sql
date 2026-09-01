-- Migration 005: Reliability Upgrade
-- Adds:
--   1. UNIQUE index on alerts(source, source_id) for DB-level deduplication.
--      Application-level dedup already exists; this constraint closes the race-condition gap.
--   2. mqtt_outbox table for persistent MQTT delivery queue.
--      Ensures alerts are not silently dropped when the broker is temporarily unavailable.

-- ── 1. Deduplication constraint ────────────────────────────────────────────────
-- Safe: IF NOT EXISTS prevents duplicate index creation on re-run.
-- This will only fail if duplicate (source, source_id) pairs already exist in the DB.
-- If the migration fails here, run the cleanup query below manually first:
--   DELETE FROM alerts WHERE rowid NOT IN (
--     SELECT MIN(rowid) FROM alerts GROUP BY source, source_id
--   );
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_source_source_id
  ON alerts(source, source_id);

-- ── 2. MQTT outbox ─────────────────────────────────────────────────────────────
-- Purpose: When the MQTT broker is unavailable, alert publications are written here.
-- On reconnect, pending entries are published and marked PUBLISHED.
-- Retains failed attempts for diagnostics without destroying alert data.
--
-- status values: PENDING | PUBLISHED | FAILED
-- qos:           1 (at-least-once) — subscriber must deduplicate by alertId
CREATE TABLE IF NOT EXISTS mqtt_outbox (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id       TEXT    NOT NULL,
  topic          TEXT    NOT NULL,
  payload        TEXT    NOT NULL,          -- JSON string, compact
  qos            INTEGER NOT NULL DEFAULT 1,
  status         TEXT    NOT NULL DEFAULT 'PENDING',
  attempts       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  last_attempt_at TEXT,
  published_at   TEXT,
  last_error     TEXT,
  FOREIGN KEY(alert_id) REFERENCES alerts(id)
);

CREATE INDEX IF NOT EXISTS idx_mqtt_outbox_status
  ON mqtt_outbox(status, created_at);

CREATE INDEX IF NOT EXISTS idx_mqtt_outbox_alert_id
  ON mqtt_outbox(alert_id);
