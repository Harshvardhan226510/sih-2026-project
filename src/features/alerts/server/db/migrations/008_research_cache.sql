CREATE TABLE IF NOT EXISTS research_historical_cache (
    id TEXT PRIMARY KEY,
    dataset_key TEXT NOT NULL,
    provider TEXT NOT NULL,
    location_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    variables TEXT NOT NULL,
    resolution TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_accessed_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    size_bytes INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_cache_access ON research_historical_cache(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_research_cache_dataset ON research_historical_cache(dataset_key);
