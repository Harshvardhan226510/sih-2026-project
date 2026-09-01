-- =============================================================================
-- Migration: alerts_v2  (2026-08-28)
-- Purpose  : Replace the initial stub alerts table with the full shared-contract
--            schema that reflects the actual WeatherGPT Alerts module output.
--
-- IMPORTANT:
--   This table is a ONE-WAY sync target from the local sql.js Alerts database.
--   It is NOT the source of truth for the Alerts module — the local DB is.
--   Other WeatherGPT modules (Chatbot, Farmer, etc.) should read from HERE.
--   The Alerts module Dashboard and notification path do NOT read from here.
-- =============================================================================

-- ── 0. Prerequisites ──────────────────────────────────────────────────────────
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ── 1. Drop the old stub table (created in init_schema) ───────────────────────
-- We do this instead of ALTER TABLE because the severity CHECK constraint and
-- missing columns make in-place migration awkward.  The local DB is unaffected.
drop table if exists alerts cascade;

-- ── 2. Create the new shared alerts table ────────────────────────────────────
-- Field mapping (local sql.js DB  →  this table):
--
--   alerts.id          (TEXT PK e.g. "imd-IMD_CAP_001")  →  external_id
--   alerts.source      (e.g. "imd")                       →  source
--   alerts.source_id   (CAP <identifier>)                 →  source_id
--   alerts.event       (event type / CAP event)           →  type
--   alerts.headline    (short headline)                   →  title
--   alerts.description                                    →  description
--   alerts.severity    (Extreme|Severe|Moderate|Minor|Unknown)  →  severity
--   alerts.status      (ACTIVE|EXPIRED|CANCELLED)         →  status
--   alerts.area        (free-text areaDesc)                →  area
--   alerts.area_code   (normalised area code)              →  area_code
--   alerts.latitude    (centroid lat)                     →  latitude
--   alerts.longitude   (centroid lon)                     →  longitude
--   alerts.polygon     (JSON [{lat,lon}…] → converted)    →  region_geom
--   alerts.language                                       →  language
--   alerts.effective_at                                   →  valid_from
--   alerts.expires_at                                     →  valid_to
--   alerts.issued_at                                      →  issued_at
--   alerts.created_at                                     →  created_at
--   alerts.updated_at                                     →  updated_at
--
-- Not synced (internal/operational — not needed by other modules):
--   instruction, urgency, certainty, raw_data, revision, version,
--   cap_msg_type, cap_references
-- =============================================================================

create table alerts (
  -- Supabase-owned identity (independent of local DB id)
  id           uuid primary key default gen_random_uuid(),

  -- Cross-reference back to the local Alerts module primary key
  -- Format: "<source>-<sanitised_sourceId>", e.g. "imd-IMD_CAP_001_2026"
  -- UNIQUE ensures repeated sync never creates duplicate rows.
  external_id  text unique not null,

  -- Alert classification
  -- Matches local alerts.event (CAP event field / event type)
  type         text not null,

  -- Short display headline (local alerts.headline)
  title        text,

  -- Full description (local alerts.description)
  description  text,

  -- Severity — exact Title-case values produced by the Alerts module normalizer.
  -- 'Extreme' is included so that the most critical IMD alerts are representable.
  -- 'Unknown' covers alerts where IMD did not supply a recognised severity value.
  severity     text not null check (
    severity in ('Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown')
  ),

  -- Lifecycle status — matches local alerts.status values.
  -- UPDATED is kept for completeness but the local pipeline currently keeps
  -- status=ACTIVE on update and uses alert_revisions to record the change.
  status       text not null default 'ACTIVE' check (
    status in ('ACTIVE', 'EXPIRED', 'CANCELLED', 'UPDATED')
  ),

  -- Data source (e.g. "imd")
  source       text,

  -- Authoritative CAP <identifier> (local alerts.source_id)
  source_id    text,

  -- Language tag (local alerts.language, default 'en')
  language     text default 'en',

  -- Geographic area — free-text CAP areaDesc (e.g. "Dakshina Kannada, Karnataka")
  -- Other modules can parse state/district from this field.
  area         text,

  -- Normalised area code (first token of areaDesc, upper-cased)
  area_code    text,

  -- Centroid coordinates (derived from polygon or provided directly by IMD)
  latitude     double precision,
  longitude    double precision,

  -- Region polygon — PostGIS geometry, WGS-84.
  -- Converted from local alerts.polygon (JSON lat/lon pairs) at sync time.
  -- NULL when the alert has no polygon or the conversion fails.
  region_geom  geometry(Polygon, 4326),

  -- Timestamps
  -- valid_from  ← local alerts.effective_at
  -- valid_to    ← local alerts.expires_at
  -- issued_at   ← local alerts.issued_at  (when IMD issued the alert)
  -- created_at  ← local alerts.created_at (preserved from local DB)
  -- updated_at  ← local alerts.updated_at (updated on every sync)
  valid_from   timestamptz,
  valid_to     timestamptz,
  issued_at    timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── 3. Indexes ────────────────────────────────────────────────────────────────
-- Optimised for the queries other modules are most likely to run.

-- Primary lookup for sync (external_id already has a unique index from the
-- UNIQUE constraint, but naming it explicitly aids query planning visibility)
create index alerts_external_id_idx  on alerts (external_id);

-- Filter by lifecycle state (most common: WHERE status = 'ACTIVE')
create index alerts_status_idx       on alerts (status);

-- Filter by severity for escalation-aware consumers
create index alerts_severity_idx     on alerts (severity);

-- Time-range queries: active alerts expiring soon, valid alerts at a point-in-time
create index alerts_valid_from_idx   on alerts (valid_from);
create index alerts_valid_to_idx     on alerts (valid_to);

-- Location-based filtering by area code (e.g. WHERE area_code = 'DAKSHINA KANNADA')
create index alerts_area_code_idx    on alerts (area_code);

-- Geospatial filtering (WHERE ST_Intersects(region_geom, <user_location_buffer>))
create index alerts_region_geom_idx  on alerts using gist (region_geom);

-- Ordered reads by issue time (most recent first)
create index alerts_issued_at_idx    on alerts (issued_at desc);

-- ── 4. Realtime ───────────────────────────────────────────────────────────────
-- Allow other modules to subscribe to live alert changes without polling.
-- This publication entry does NOT affect the local Dashboard or notification path.
alter publication supabase_realtime add table alerts;

-- ── 5. Row Level Security ─────────────────────────────────────────────────────
-- Preserve the hackathon shared-demo intent:
--   · Any anonymous client can READ alerts (for other module frontends).
--   · Only the server (service-role key, never sent to browser) can WRITE.
--   · No public insert/update/delete from anonymous clients.
alter table alerts enable row level security;

-- Public read — same as the original init_schema policy
create policy "public read alerts"
  on alerts for select
  using (true);

-- Service-role write — server-side sync uses the service-role key which bypasses
-- RLS automatically in Supabase.  This explicit policy is a belt-and-suspenders
-- guard for any non-service-role write attempts.
-- (In Supabase, service_role bypasses RLS by default; this policy is kept here
--  for documentation clarity and to prevent accidental public writes.)
create policy "service role write alerts"
  on alerts for all
  using     (auth.role() = 'service_role')
  with check(auth.role() = 'service_role');
