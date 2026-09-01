# WeatherGPT Farmer Dashboard

Run `npm install`, copy `.env.example` to `.env`, set Supabase credentials, then `npm run dev`. The API proxies Open-Meteo location search and forecasts, applies deterministic advisories, and has authenticated farmer-crop CRUD. It uses Supabase Auth bearer tokens outside `DEMO_MODE`.

`supabase/migrations/202608260001_farmer_dashboard_schema.sql` is intentionally pending validation against the shared `users`/`locations` ERD and RLS convention before it is applied.

## Backend contract

- `GET /api/farmer/locations/search?q=nashik`
- `POST /api/farmer/weather/refresh` with `{ "latitude": 19.99, "longitude": 73.78, "locationId": "optional-uuid" }`
- `GET /api/farmer/dashboard?latitude=19.99&longitude=73.78&location=Nashik`
- `GET|POST /api/farmer/crops`, `PATCH|DELETE /api/farmer/crops/:id`

The Open-Meteo endpoints are live and keyless. When a `locationId` is provided, weather snapshots are served from—and refreshed into—the module cache table. Crop endpoints require a valid Supabase bearer token and assume the shared `locations` table exposes `id`, `name`, `latitude`, and `longitude`; confirm this against the shared ERD before connecting it.
