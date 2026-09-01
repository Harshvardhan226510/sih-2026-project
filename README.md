# WeatherGPT Alert System

Indian weather alert monitoring system with offline-first architecture, designed for low-bandwidth and unreliable network conditions.

## Architecture

```
IMD CAP Feed / Open-Meteo
         │
    Weather Providers (abstracted)
         │
    Ingestion Service (scheduled)
         │
    Normalize → Validate → Deduplicate
         │
    SQLite Database (server truth)
         │
    REST API (compressed, ETag, pagination)
         │
    Incremental Sync (revision-based)
         │
    IndexedDB (client working copy)
         │
    React Dashboard (offline-first)
```

**Data sources**: Real IMD CAP alerts from India Meteorological Department. Open-Meteo available for forecast context.

## Project Structure

```
sih-2026-project/
├── server/                    # Backend
│   ├── app.js                 # Express app + middleware
│   ├── index.js               # Server entry point
│   ├── config/                # Environment config
│   ├── controllers/           # Request handlers
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   │   ├── ingestion.js       # Provider fetch → normalize → store
│   │   ├── normalization.js   # CAP → unified model
│   │   ├── processing.js      # Dedup, severity, expiry
│   │   ├── sync.js            # Revision-based sync
│   │   └── expiry.js          # Alert lifecycle
│   ├── providers/             # Weather data sources
│   │   ├── base.js            # Abstract WeatherProvider
│   │   ├── imd.js             # IMD CAP RSS + XML
│   │   └── openMeteo.js       # Forecast context
│   ├── repositories/          # Database operations
│   ├── models/                # Data validation
│   ├── jobs/                  # Cron scheduler
│   ├── db/                    # SQLite + migrations
│   ├── tests/                 # Unit tests
│   └── utils/                 # HTTP, XML, logging
├── src/                       # Frontend
│   ├── features/alerts/       # Alert module
│   │   ├── AlertDashboard.jsx # Main page
│   │   ├── AlertDashboard.css # Styles
│   │   ├── components/        # UI components
│   │   ├── hooks/             # React hooks
│   │   ├── services/          # API, IndexedDB, sync
│   │   └── utils.js           # Severity config, formatters
│   ├── App.jsx                # Router
│   └── main.jsx               # Entry + SW registration
├── public/
│   ├── sw.js                  # Service worker
│   └── manifest.json          # PWA manifest
├── docs/                      # Architecture docs
├── .env.example               # Environment template
└── vite.config.js             # Vite + API proxy
```

## Setup

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env as needed
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `NODE_ENV` | `development` | Environment |
| `DB_PATH` | `./server/db/weathergpt.db` | SQLite database path |
| `IMD_RSS_URL` | `https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml` | IMD CAP feed |
| `OPEN_METEO_BASE_URL` | `https://api.open-meteo.com/v1` | Open-Meteo API |
| `INGESTION_CRON` | `*/10 * * * *` | Ingestion schedule |
| `LOG_LEVEL` | `info` | Logging level |

## Running

### Start Backend

```bash
cd server
npm run dev
```

The server initializes the database, runs initial ingestion from the real IMD feed, and starts the cron scheduler.

### Start Frontend

```bash
npm run dev
```

Open `http://localhost:5173/alerts`

The Vite dev server proxies `/api` requests to the backend at `localhost:3001`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/alerts` | Paginated alerts (query: `severity`, `event`, `area`, `status`, `page`, `limit`) |
| `GET` | `/api/alerts/:id` | Alert detail |
| `GET` | `/api/alerts/sync?since=N` | Incremental sync since revision N |
| `GET` | `/api/alerts/bootstrap` | Initial dataset (active alerts, max 100) |
| `GET` | `/api/alerts/summary` | Severity counts |
| `GET` | `/api/health` | Server + IMD provider health |
| `POST` | `/api/alerts/ingest` | Manual IMD ingestion trigger (returns diagnostics) |
| `POST` | `/api/admin/ingest` | Manual IMD ingestion trigger (alias) |

All responses support `ETag` / `If-None-Match` for conditional requests. Responses are gzip-compressed.

### Manual Ingestion

Trigger a real-time fetch from the IMD feed:

```bash
curl -X POST http://localhost:3001/api/admin/ingest
```

Returns provider name, fetch time, feed status, and ingestion results (created, updated, skipped, expired).

### Health / Provider Status

```bash
curl http://localhost:3001/api/health
```

Returns IMD provider health including: status (healthy/degraded/unknown), last successful fetch, consecutive failures, active alert count, and expired alert count. This distinguishes "0 active alerts" from "IMD provider is broken."

## Offline Strategy

1. App shell loads from Service Worker cache (works without network)
2. Alert data loads from IndexedDB immediately on page open
3. Background sync fetches only deltas using revision-based protocol
4. Network quality detection adapts behavior (FAST/NORMAL/SLOW/OFFLINE)
5. Local filtering and search work without any network requests
6. Sync status indicator shows: Online / Offline / Syncing + last sync time

## Data Providers

### IMD (Indian Meteorological Department)

Fetches real CAP 1.2 alerts from the WMO Alert Hub RSS feed. Parses individual CAP XML files for each alert. No API key required.

### Open-Meteo

Provides supplementary forecast data (temperature, humidity, wind, precipitation) for alert areas. No API key required. Does not generate or substitute official IMD alerts.

## Testing

```bash
cd server
node --test tests/
```

Tests cover: XML parsing, CAP normalization, alert processing, deduplication, severity classification, expiry detection.

### Real-Data Testing

1. Start the backend — it fetches real IMD alerts on boot
2. Trigger manual ingestion: `POST /api/admin/ingest`
3. Verify alerts in database have `source = 'imd'`
4. Test offline: load the app, disconnect network, verify cached IMD data remains available
5. Reconnect and verify sync resumes

## Deployment

For production:

1. Set `NODE_ENV=production`
2. Build frontend: `npm run build`
3. Serve `dist/` with a static server or configure Express to serve it
4. Run `node server/index.js`

For PostgreSQL migration: the schema uses standard SQL compatible with PostgreSQL. Replace `sql.js` with `pg` and update the connection module.
