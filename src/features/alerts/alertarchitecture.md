# Alert System Architecture

This document describes the end-to-end architecture of the Alert System, covering both the frontend and backend components, data flows, and external integrations.

## 1. High-Level Overview

The Alert System is designed to ingest weather and emergency alerts from external providers (e.g., IMD), normalize them, store them reliably, and distribute them to users via multiple channels (Web Push, MQTT, and client-side syncing).

## 2. Backend Architecture (`server/`)

The backend is responsible for ingestion, processing, storage, and notification routing.

### 2.1 Ingestion Pipeline (`services/ingestion.js`)
- **Providers (`providers/imd.js`, `providers/openMeteo.js`)**: Fetches raw alerts (RSS/CAP format).
- **Normalization (`services/normalization.js`)**: Converts provider-specific alert formats into a standardized internal representation. Per-alert isolation is applied so that one malformed alert does not fail the entire batch.
- **Processing (`services/processing.js`)**: Evaluates the normalized alerts:
  - **Deduplication**: Checks against existing records in the DB via `sourceId`.
  - **Change Detection**: Identifies if an alert is new (`toCreate`), has meaningful changes (`toUpdate`), or is explicitly cancelled via CAP messages (`toCancel`).
- **Expiry (`services/expiry.js`)**: Automatically expires alerts that have passed their validity period.

### 2.2 Storage (`repositories/`)
- Uses SQLite as the authoritative source of truth.
- **`alertRepository.js`**: Manages CRUD operations for alerts.
- **`mqttOutboxRepository.js`**: Implements the Outbox pattern for reliable MQTT message delivery.
- **`pushRepository.js` & `deliveryRepository.js`**: Manages Web Push subscriptions and delivery statuses.

### 2.3 Notification & Delivery (`services/`)
- **`notificationRouter.js`**: Routes processed events (`CREATED`, `UPDATED`) to appropriate delivery channels.
- **`mqttService.js`**: Server-side MQTT publisher for real-time alerts. Uses QoS 1 (at-least-once) delivery. If the broker is offline, messages are stored in `mqtt_outbox` and flushed upon reconnection. Topic structure: `weathergpt/alerts/{state}/{district}`.
- **`webPush.js` & `delivery.js`**: Handles sending Web Push notifications to subscribed users.
- **`supabaseSync.js` / `sync.js`**: Optional synchronization of alerts to a Supabase instance.

### 2.4 API & Routing (`routes/`, `controllers/`)
- **`alerts.js` & `alertController.js`**: Exposes REST endpoints for the frontend to fetch alerts, sync state, and register devices for push notifications.

---

## 3. Frontend Architecture (`components/`, `services/`, `hooks/`)

The frontend is built to be resilient, offline-capable, and location-aware.

### 3.1 Local Storage & Sync (`services/syncService.js`, `services/alertDb.js`)
- **`alertDb.js`**: Uses IndexedDB (or similar local storage) to cache alerts locally on the device, allowing offline access.
- **`syncService.js`**: Handles synchronization between the local database and the server.
  - Fetches deltas (only new/updated/removed alerts based on `revision`).
  - Syncs pending location updates when the device comes back online.
  - Applies incoming alerts to the local cache and removes expired/cancelled ones.
- **`alertApi.js`**: Wraps the backend REST API calls.

### 3.2 Location Awareness (`services/locationWatcher.js`)
- Watches the user's GPS/network location.
- Sends location updates to the backend to ensure the user receives relevant localized alerts (e.g., district-level warnings).

### 3.3 Push Notifications (`services/pushService.js`)
- Manages the Service Worker registration and Web Push subscriptions.
- Interacts with the backend to link the `deviceId` with the push subscription.

### 3.4 UI Components (`components/`)
- **`AlertFeed.jsx`**: The main view displaying a feed of active alerts.
- **`AlertCard.jsx` / `AlertDetail.jsx`**: Displays individual alert summaries and detailed views.
- **`AlertFilters.jsx` & `AlertSearch.jsx`**: Provides filtering and search capabilities over the local alert cache.
- **`LocationSettings.jsx`**: Allows users to configure their location preferences manually or automatically.

---

## 4. Key Data Flows

### Ingestion to Notification Flow
1. **Cron/Job**: Triggers `ingestion.js` to fetch from IMD.
2. **Normalize & Process**: Raw XML/JSON -> Normalized Object -> Checked against DB.
3. **Database Transaction**: New/Updated alerts are saved.
4. **Router**: `notificationRouter` is called for new/updated alerts.
5. **Channels**: 
   - `mqttService` publishes to the respective `{state}/{district}` topic.
   - `webPush` queues notifications for users registered in the affected area.

### Client Sync Flow
1. **App Load/Resume**: Frontend calls `syncService.performSync()`.
2. **Location Update**: If the device location changed while offline, it is sent to the server.
3. **Delta Fetch**: The client sends its current `localRevision`.
4. **Server Response**: Server returns only the alerts modified since `localRevision`, and IDs of active alerts.
5. **Local Update**: `alertDb` is updated, UI re-renders based on the new local state.

## 5. Reliability Guarantees
- **Resilient Ingestion**: Per-alert isolation ensures one bad alert doesn't stop ingestion.
- **MQTT Outbox**: Network failures to the MQTT broker do not lose messages; they are queued and retried.
- **Client Offline Support**: The frontend functions entirely off the local database, syncing only deltas when the network is restored.
