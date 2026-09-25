import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { subscribeToPush, isPushSupported } from './features/alerts/services/pushService.js'
import * as alertDb from './features/alerts/services/alertDb.js'
import { startLocationWatcher } from './features/alerts/services/locationWatcher.js'

// ─── Service Worker Registration ────────────────────────────────────────────────
// The Service Worker handles:
//  - App shell caching (offline support)
//  - Web Push events (background OS notifications — works when tab is CLOSED)
//
// Push subscription is initiated after SW registration completes.
// If permission is denied or push is unsupported, the app continues normally
// via REST sync + IndexedDB.

// Start background location tracking if user previously opted in
startLocationWatcher();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

/**
 * Initiate Web Push subscription.
 * Uses the device ID and saved location from IndexedDB.
 * Does NOT request GPS. Uses state/district strings only.
 * Does NOT ask for permission if already denied.
 */
async function initPushSubscription() {
  try {
    const deviceId = await alertDb.getDeviceId();
    const location = await alertDb.getUserLocation();
    const result = await subscribeToPush(deviceId, location.state, location.district);
    if (!result.success) {
      // Silently continue — push is optional; REST sync is the primary delivery
      console.debug('[WeatherGPT] Push subscription not active:', result.reason);
    }
  } catch {
    // Non-fatal
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)