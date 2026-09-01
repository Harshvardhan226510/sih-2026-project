# Farmer Advisory Dashboard — Module Architecture

## Purpose

The Farmer Advisory Dashboard gives a farmer location-specific weather, a seven-day forecast, crop context, and a simple action-oriented advisory. The user can search for a village or district, change the language, select a forecast day or crop, and add a crop locally.

## Architecture at a glance

```text
Farmer browser (React + Vite)
  ├─ GET /api/search-city?city=... ──────────────┐
  ├─ GET /api/weather?lat=...&lon=... ───────────┼─> Express API / Vercel entry
  ├─ Derives displayed rain advisory locally      │        ├─ Open-Meteo Geocoding API
  └─ Persists dashboard snapshot and language ───┘        └─ Open-Meteo Forecast API

Integration-ready path (implemented, not currently called by main.jsx)
  React dashboard ─ ─> /api/farmer/* ─ ─> Supabase Auth + PostgreSQL
                                  ├─ farmer crop CRUD
                                  ├─ weather snapshot cache
                                  └─ deterministic advisory rules
```

Solid-flow endpoints above are the current runtime path. The integration-ready path is present in the repository but is not wired into the displayed React dashboard.

## 1. Frontend layer

**Technology:** React 19, Vite, CSS, browser `localStorage`.

`src/main.jsx` is the application orchestrator. It owns location, selected forecast day, active crop, search/add-crop visibility, language, loading, and offline state. It fetches real weather data when the selected location changes.

| Component | Responsibility |
| --- | --- |
| `Header.jsx` | Farmer greeting; language selector; location, crop, and advisory actions. |
| `LocationSearch.jsx` | Searches for a village or district and lets the farmer select coordinates. |
| `AddCrop.jsx` | Adds a selected crop to the browser-side dashboard state. |
| `PrimaryAdvisory.jsx` | Renders the primary advisory, action/reason/avoid guidance, forecast selector, farm actions, and Mandi/Schemes slots. |
| `Sidebar.jsx` | Shows selected location conditions and crop cards. |
| `MandiSchemes.jsx` | Renders market-price and government-scheme data if supplied. |
| `i18n.js` | English, Hindi, and Marathi UI copy plus local advisory translation. |

### Browser persistence

- `weathergpt-dashboard`: latest successfully loaded dashboard snapshot.
- `weathergpt-language`: selected language (`en`, `hi`, or `mr`).

## 2. Active API and data flow

### Location search

1. `LocationSearch` sends `GET /api/search-city?city=<query>`.
2. Express calls the Open-Meteo Geocoding API.
3. The API returns a normalized display name, latitude, and longitude.
4. The selected result becomes the active dashboard location.

### Weather and displayed advisory

1. `main.jsx` sends `GET /api/weather?lat=<latitude>&lon=<longitude>`.
2. Express calls the Open-Meteo Forecast API for current conditions and daily fields.
3. React transforms the raw response into current temperature, humidity, wind speed, rain probability, and a seven-day forecast.
4. React derives the current displayed advisory:
   - Rain probability over 50%: **“Rain expected — delay spraying.”**
   - Otherwise: **“Safe to spray today.”**
5. The dashboard snapshot is saved in `localStorage` and displayed with the last-sync time.

The dashboard intentionally has no dummy weather fallback. A failed request shows the loading/error experience instead of fabricated weather information.

## 3. Server layer

**Technology:** Express 5, CORS, environment configuration, Vercel serverless entry.

- Local development: Vite proxies `/api` requests to the Express server on port 3001.
- Vercel: `api/index.js` exports the Express app; `vercel.json` routes `/api/*` to it and falls back to the Vite SPA.
- `server/src/weatherService.js` contains the reusable, normalized Open-Meteo weather and geocoding service.
- `server/src/server.js` defines the active routes and the integration-ready farmer routes.

## 4. Integration-ready farmer services

The following services are implemented but are not yet used by `src/main.jsx`:

- Authenticated farmer dashboard: `GET /api/farmer/dashboard`
- Authenticated location search: `GET /api/farmer/locations/search?q=...`
- Weather refresh with cache: `POST /api/farmer/weather/refresh`
- Farmer crop CRUD: `GET|POST /api/farmer/crops`, `PATCH|DELETE /api/farmer/crops/:id`

### Advisory rules

`server/src/advisoryRules.js` applies a deterministic priority order:

1. Rain probability at least 60% → delay spraying.
2. Wind speed at least 25 km/h → postpone spraying.
3. Maximum temperature at least 35°C → irrigate early.
4. Otherwise → favourable conditions for field work.

The rule tests in `server/test/advisoryRules.test.js` cover rain, wind, and heat conditions.

### Supabase data model

The migration defines `farmer_profiles`, `crops`, `farmer_crops`, `weather_snapshots`, `advisories`, and `market_prices`, with Row Level Security policies. The database design assumes shared `users` and `locations` tables. As documented in the repository, the migration must be validated against the shared ERD and RLS convention before it is applied.

The authenticated path uses a Supabase bearer token outside demo mode. Weather snapshots can be cached per location for the configured duration (default: 60 minutes).

## 5. Current limitations and handoff notes

- Current React calls `/api/weather` and `/api/search-city`, not `/api/farmer/*`.
- Crop additions in the current UI are browser-local; they do not call the crop CRUD endpoints.
- Mandi price and scheme UI sections are rendered when data is available. The active React weather refresh currently provides empty lists; sample values only exist in the integration-ready farmer dashboard response.
- The `aviation-marine-*` assets in the folder are unrelated to this Farmer Dashboard module and are not part of this architecture.

## Diagram

See [farmer-dashboard-architecture.svg](farmer-dashboard-architecture.svg) for the presentation-ready architecture chart. Solid arrows show the active runtime path; dashed boxes and arrows show implemented capabilities awaiting frontend integration or migration validation.
