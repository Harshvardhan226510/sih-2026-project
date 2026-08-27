# WeatherGPT Alert System — Testing Guide

This guide details the step-by-step instructions to verify the entire alert architecture, from real IMD ingestion down to offline client caching and Web Push notifications.

## 1. Verifying Real IMD Ingestion
1. Start the server (`npm run dev` in `server/`).
2. Trigger the ingestion process manually (or wait for the cron schedule):
   ```bash
   curl -X POST http://localhost:3001/api/admin/ingest
   ```
3. Observe the logs:
   - Ensure you see: `starting ingestion` and `ingestion complete`.
   - The result should report real alerts created/updated from the IMD RSS.
4. Verify the database:
   - `sqlite3 weathergpt.db`
   - `SELECT count(*) FROM alerts WHERE source='imd';`
   - You should see active alerts. No "mock" alerts should be present.

## 2. Verifying Web Push Notifications
1. Run `npm run generate:vapid` to generate your VAPID keys if you haven't already.
2. Start the Vite frontend (`npm run dev` in the root).
3. Open `http://localhost:5173/` in a modern browser (Chrome, Edge, Firefox).
4. When prompted, **Allow Notifications**.
5. Close the WeatherGPT browser tab completely.
6. Trigger an ingestion on the server (using the curl command above).
7. If IMD has issued a new alert for your location (or an `Extreme` alert anywhere), you will receive a native OS notification.

## 3. Verifying Offline Cache
1. Open the WeatherGPT dashboard.
2. Ensure you have network connectivity. The network badge should say "Online" and alerts should be visible.
3. Open Developer Tools → Network tab → Select "Offline" (or turn off Wi-Fi).
4. Refresh the page.
5. The dashboard should instantly load the previously cached alerts from IndexedDB.
6. The network badge should update to "Offline".
7. No loading spinners should block the UI.

## 4. Verifying MQTT Publish
1. Connect to your MQTT broker (e.g. HiveMQ Cloud) using an MQTT client tool like MQTT Explorer.
2. Subscribe to the topic: `weathergpt/alerts/#`
3. Trigger an ingestion on the server.
4. If a new alert is ingested (or an existing one updated), you will see a message published to `weathergpt/alerts/{state}/{district}` (or `{state}/all` for Extreme alerts).
5. The payload will be compact JSON containing the alert ID, severity, and event.

## 5. Verifying Low Bandwidth Optimization
1. Open Developer Tools → Network tab → Select "Slow 3G" (which forces the effectiveType to `2g` in Chromium).
2. Refresh the page.
3. Observe the `/api/alerts/sync` network request in the Network tab.
4. The response payload will be significantly smaller (ultra-compact schema).
5. The UI network badge will say "Slow Network".

## 6. Verifying Deduplication
1. Trigger ingestion multiple times (`curl -X POST http://localhost:3001/api/admin/ingest`).
2. The logs should report `created: 0, updated: 0, skipped: N` on subsequent runs.
3. Check `sqlite3 weathergpt.db "SELECT sourceId, COUNT(*) from alerts GROUP BY sourceId HAVING COUNT(*) > 1;"`
4. The result should be empty, proving `sourceId` deduplication is working perfectly.
