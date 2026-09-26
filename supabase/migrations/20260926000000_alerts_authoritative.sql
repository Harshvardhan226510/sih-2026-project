-- =============================================================================
-- Migration: alerts_v3_authoritative
-- Purpose  : Create the complete authoritative schema for the Alerts system.
-- =============================================================================

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- 1. Drop the one-way sync alerts table if it exists
drop table if exists alert_deliveries cascade;
drop table if exists alert_revisions cascade;
drop table if exists alerts cascade;
drop table if exists sync_state cascade;
drop table if exists devices cascade;
drop table if exists push_subscriptions cascade;
drop table if exists provider_status cascade;
drop table if exists mqtt_outbox cascade;

-- 2. Create authoritative alerts table
create table alerts (
  id text primary key, -- e.g., 'imd-IMD_CAP_001'
  source text not null,
  source_id text not null,
  event text,
  headline text,
  description text,
  instruction text,
  severity text not null check (severity in ('Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown')),
  urgency text,
  certainty text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'EXPIRED', 'CANCELLED', 'UPDATED')),
  effective_at timestamptz,
  expires_at timestamptz,
  issued_at timestamptz,
  area text,
  area_code text,
  latitude double precision,
  longitude double precision,
  polygon text,
  language text default 'en',
  raw_data text,
  revision bigint not null,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create index idx_alerts_status on alerts(status);
create index idx_alerts_revision on alerts(revision);

-- 3. Create sync_state table
create table sync_state (
  id integer primary key check (id = 1),
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into sync_state (id, revision) values (1, 0);

-- 4. Create alert_revisions table
create table alert_revisions (
  id bigint generated always as identity primary key,
  alert_id text not null references alerts(id) on delete cascade,
  revision bigint not null,
  action text not null,
  diff text,
  created_at timestamptz not null default now()
);
create index idx_alert_revisions_alert_id on alert_revisions(alert_id);
create index idx_alert_revisions_revision on alert_revisions(revision);

-- 5. Create provider_status table
create table provider_status (
  provider text primary key,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error text,
  consecutive_failures integer not null default 0,
  alert_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 6. Create devices table
create table devices (
  device_id text primary key,
  state text,
  district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Create alert_deliveries table
create table alert_deliveries (
  id bigint generated always as identity primary key,
  device_id text not null references devices(device_id) on delete cascade,
  alert_id text not null references alerts(id) on delete cascade,
  status text not null check (status in ('pending', 'delivered', 'acknowledged', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(device_id, alert_id)
);

-- 8. Create push_subscriptions table
create table push_subscriptions (
  endpoint text primary key,
  device_id text not null references devices(device_id) on delete cascade,
  p256dh text not null,
  auth text not null,
  state text,
  district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Create mqtt_outbox table
create table mqtt_outbox (
  id bigint generated always as identity primary key,
  topic text not null,
  payload text not null,
  qos integer not null default 1,
  created_at timestamptz not null default now()
);

-- 10. Enable RLS
alter table alerts enable row level security;
create policy "public read alerts" on alerts for select using (true);
create policy "service role write alerts" on alerts for all using (auth.role() = 'service_role') with check(auth.role() = 'service_role');

alter table sync_state enable row level security;
create policy "public read sync_state" on sync_state for select using (true);

alter table alert_revisions enable row level security;
create policy "public read alert_revisions" on alert_revisions for select using (true);

alter table devices enable row level security;
create policy "public read devices" on devices for select using (true);
create policy "service role write devices" on devices for all using (auth.role() = 'service_role');

alter table alert_deliveries enable row level security;
create policy "public read alert_deliveries" on alert_deliveries for select using (true);
create policy "service role write alert_deliveries" on alert_deliveries for all using (auth.role() = 'service_role');

alter table push_subscriptions enable row level security;
create policy "service role access push_subscriptions" on push_subscriptions for all using (auth.role() = 'service_role');

alter table provider_status enable row level security;
create policy "service role access provider_status" on provider_status for all using (auth.role() = 'service_role');

alter table mqtt_outbox enable row level security;
create policy "service role access mqtt_outbox" on mqtt_outbox for all using (auth.role() = 'service_role');
