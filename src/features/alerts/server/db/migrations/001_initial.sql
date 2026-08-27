CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  event TEXT NOT NULL,
  headline TEXT,
  description TEXT,
  instruction TEXT,
  severity TEXT NOT NULL DEFAULT 'Unknown',
  urgency TEXT,
  certainty TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  effective_at TEXT,
  expires_at TEXT,
  issued_at TEXT NOT NULL,
  area TEXT,
  area_code TEXT,
  latitude REAL,
  longitude REAL,
  polygon TEXT,
  language TEXT DEFAULT 'en',
  raw_data TEXT,
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_source_id ON alerts(source_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_event ON alerts(event);
CREATE INDEX IF NOT EXISTS idx_alerts_effective_at ON alerts(effective_at);
CREATE INDEX IF NOT EXISTS idx_alerts_expires_at ON alerts(expires_at);
CREATE INDEX IF NOT EXISTS idx_alerts_area_code ON alerts(area_code);
CREATE INDEX IF NOT EXISTS idx_alerts_updated_at ON alerts(updated_at);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_revision ON alerts(revision);

CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO sync_state (id, revision, updated_at) VALUES (1, 0, datetime('now'));

CREATE TABLE IF NOT EXISTS provider_status (
  provider TEXT PRIMARY KEY,
  last_success_at TEXT,
  last_failure_at TEXT,
  last_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  alert_count INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alert_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  action TEXT NOT NULL,
  diff TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alert_revisions_alert_id ON alert_revisions(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_revisions_revision ON alert_revisions(revision);
