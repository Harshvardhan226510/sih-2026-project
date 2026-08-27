-- Migration 003: Delivery System
-- Support for persistent alert delivery queue, device registration, and acknowledgements

CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    state TEXT,
    district TEXT,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    priority INTEGER DEFAULT 3,
    status TEXT DEFAULT 'PENDING', -- PENDING, DELIVERED, ACKNOWLEDGED, FAILED
    attempts INTEGER DEFAULT 0,
    next_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(alert_id) REFERENCES alerts(id),
    FOREIGN KEY(device_id) REFERENCES devices(id)
);

CREATE INDEX IF NOT EXISTS idx_delivery_queue_status_next_attempt ON delivery_queue(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_delivery_queue_device_id ON delivery_queue(device_id);
CREATE INDEX IF NOT EXISTS idx_delivery_queue_alert_id ON delivery_queue(alert_id);

CREATE TABLE IF NOT EXISTS acknowledgements (
    alert_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(alert_id, device_id),
    FOREIGN KEY(alert_id) REFERENCES alerts(id),
    FOREIGN KEY(device_id) REFERENCES devices(id)
);
