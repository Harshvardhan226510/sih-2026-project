-- Migration 004: Web Push Subscriptions
-- Stores browser push subscriptions for OS-level background notifications.
-- Each row represents one browser push subscription endpoint.
-- A device may have multiple subscriptions (e.g. different browser profiles).

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id     TEXT NOT NULL,
    endpoint      TEXT NOT NULL UNIQUE,
    p256dh        TEXT NOT NULL,
    auth          TEXT NOT NULL,
    state         TEXT,
    district      TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_success_at DATETIME,
    last_failure_at DATETIME,
    failure_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_push_subs_device_id  ON push_subscriptions(device_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_state       ON push_subscriptions(state);
CREATE INDEX IF NOT EXISTS idx_push_subs_district    ON push_subscriptions(district);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint    ON push_subscriptions(endpoint);
