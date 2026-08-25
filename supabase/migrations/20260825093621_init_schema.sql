-- WeatherGPT — shared schema (run once, before any module work starts)
-- Target: Supabase Postgres. Run via `supabase/migrations/` or the SQL editor.

create extension if not exists postgis;
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ─────────────────────────────────────────────────────────
-- locations — every place the app knows about (farms, airports, cities...)
-- ─────────────────────────────────────────────────────────
create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  geom geometry(Point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)) stored,
  created_at timestamptz default now()
);
create index locations_geom_idx on locations using gist (geom);

-- ─────────────────────────────────────────────────────────
-- observations — raw current-weather readings
-- ─────────────────────────────────────────────────────────
create table observations (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade,
  source text,                     -- e.g. 'open-meteo', 'imd'
  temp_c numeric,
  humidity numeric,
  wind_kph numeric,
  rainfall_mm numeric,
  recorded_at timestamptz not null default now()
);
create index observations_location_idx on observations(location_id, recorded_at desc);

-- ─────────────────────────────────────────────────────────
-- forecasts — cached NWP/model output, keyed by location + validity window
-- ─────────────────────────────────────────────────────────
create table forecasts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade,
  model_source text,               -- e.g. 'open-meteo-gfs'
  valid_from timestamptz,
  valid_to timestamptz,
  payload jsonb,                   -- raw forecast blob (hourly/daily arrays etc.)
  fetched_at timestamptz default now()
);
create index forecasts_location_idx on forecasts(location_id, valid_from);

-- ─────────────────────────────────────────────────────────
-- alerts — owned by the Alerts module. Realtime-enabled below.
-- ─────────────────────────────────────────────────────────
create table alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,              -- e.g. 'cyclone', 'heavy_rain', 'heatwave'
  severity text check (severity in ('advisory','watch','warning','severe')),
  region_geom geometry(Polygon, 4326),
  message text not null,
  language text default 'en',
  valid_from timestamptz default now(),
  valid_to timestamptz,
  created_at timestamptz default now()
);
create index alerts_region_idx on alerts using gist (region_geom);

-- push new/changed alerts to every subscribed client instantly (no polling)
alter publication supabase_realtime add table alerts;

-- ─────────────────────────────────────────────────────────
-- chat_logs — owned by the Chatbot module
-- ─────────────────────────────────────────────────────────
create table chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  location_id uuid references locations(id),
  query text not null,
  response text,
  sources jsonb,                   -- which data grounded the answer
  language text default 'en',
  created_at timestamptz default now()
);
create index chat_logs_created_idx on chat_logs(created_at desc);

-- ─────────────────────────────────────────────────────────
-- translations — shared cache, keyed by content hash + language
-- ─────────────────────────────────────────────────────────
create table translations (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null,
  language text not null,
  translated_text text not null,
  created_at timestamptz default now(),
  unique (content_hash, language)
);

-- ─────────────────────────────────────────────────────────
-- crop_stage_rules — owned by the Farmer module
-- ─────────────────────────────────────────────────────────
create table crop_stage_rules (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  stage text not null,
  condition jsonb not null,        -- e.g. {"rain_next_48h_mm_gt": 20}
  advisory_text text not null,
  advisory_text_hi text,           -- seed one translation manually if Bhashini isn't wired up yet
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- RLS — left open for the hackathon demo. Tighten if you have time.
-- ─────────────────────────────────────────────────────────
alter table locations enable row level security;
alter table observations enable row level security;
alter table forecasts enable row level security;
alter table alerts enable row level security;
alter table chat_logs enable row level security;
alter table translations enable row level security;
alter table crop_stage_rules enable row level security;

create policy "public read" on locations for select using (true);
create policy "public read" on observations for select using (true);
create policy "public read" on forecasts for select using (true);
create policy "public read" on alerts for select using (true);
create policy "public read" on crop_stage_rules for select using (true);

create policy "public insert" on chat_logs for insert with check (true);
create policy "public insert" on observations for insert with check (true);
create policy "public insert" on forecasts for insert with check (true);
create policy "public insert" on alerts for insert with check (true);