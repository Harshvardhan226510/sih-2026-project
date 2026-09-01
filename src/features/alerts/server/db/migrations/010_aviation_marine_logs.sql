-- Migration 010: Aviation and Marine Telemetry Logs

CREATE TABLE IF NOT EXISTS aviation_marine_logs (
    id TEXT PRIMARY KEY,
    query_type TEXT NOT NULL,
    request_params TEXT NOT NULL,
    response_summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aviation_marine_logs_type ON aviation_marine_logs(query_type, created_at DESC);
