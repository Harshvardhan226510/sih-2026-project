-- Migration 009: Research Analytics Enhancements
-- Lightweight bounded recent queries table

CREATE TABLE IF NOT EXISTS research_recent_queries (
    id TEXT PRIMARY KEY,
    query_type TEXT NOT NULL,
    title TEXT NOT NULL,
    location_json TEXT NOT NULL,
    params_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recent_queries_time ON research_recent_queries(created_at DESC);
