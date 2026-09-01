-- Add local version tracking to alerts

-- 1. Add version column to alerts table
ALTER TABLE alerts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- 2. Create index on version for potential future queries
CREATE INDEX IF NOT EXISTS idx_alerts_version ON alerts(version);
