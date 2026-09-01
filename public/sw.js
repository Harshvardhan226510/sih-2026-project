/**
 * WeatherGPT Service Worker
 *
 * Responsibilities:
 *  1. App shell caching (install/activate) — for offline support
 *  2. Fetch handling — cache-first for shell assets, network-first for API
 *  3. Push event — receive Web Push, display OS notification (works with tab CLOSED)
 *  4. Notification click — focus existing WeatherGPT window or open new tab
 *
 * Architecture note:
 *  Web Push + Service Worker is the ONLY mechanism for background notifications.
 *  setInterval, open tabs, WebSocket connections are NOT used for this purpose.
 *  The browser/OS push infrastructure wakes this Service Worker when a push arrives,
 *  even when WeatherGPT is not open.
 *
 * Push payload format (compact, < 3 KB):
 *  {
 *    "alertId":  "imd-...",
 *    "severity": "Extreme",
 *    "event":    "Heavy Rainfall",
 *    "area":     "Dakshina Kannada, Karnataka",
 *    "title":    "EXTREME WEATHER ALERT"
 *  }
 */

const CACHE_NAME = 'weathergpt-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
];

const APP_ORIGIN = self.location.origin;

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline or network failure' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });

      return cached || fetchPromise;
    })
  );
});

// ─── Push ─────────────────────────────────────────────────────────────────────
//
// This handler wakes even when WeatherGPT is not open.
// The OS/browser push infrastructure delivers the event to this Service Worker.
// Do NOT attempt to open a WebSocket or MQTT connection here.
//
self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  let payload;

  try {
    payload = event.data ? event.data.json() : null;
  } catch {
    // Malformed JSON payload — show a generic notification
    payload = null;
  }

  if (!payload) {
    // Fallback notification when payload is missing or malformed
    await self.registration.showNotification('WeatherGPT Alert', {
      body: 'A new weather alert has been issued. Tap to view details.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'weathergpt-alert-generic',
      renotify: false,
    });
    return;
  }

  const { alertId, severity, event: alertEvent, area, title } = payload;

  // Build notification body — compact for 2G users
  const body = area
    ? `${alertEvent || 'Weather Alert'}\n${area}`
    : (alertEvent || 'New alert issued. Tap to view details.');

  // Notification options
  const notificationOptions = {
    body,
    icon:    '/favicon.svg',
    badge:   '/favicon.svg',
    // tag deduplicates: same alertId won't show a second notification
    tag:     alertId ? `weathergpt-alert-${alertId}` : 'weathergpt-alert',
    renotify: false, // don't re-notify if same tag is already shown
    data: {
      alertId,
      severity,
      area,
      url: alertId ? `/#/alerts/${alertId}` : '/',
    },
    // Vibration pattern for mobile: 200ms on, 100ms off, 200ms on
    vibrate: [200, 100, 200],
    // Actions (browser support varies)
    actions: [
      { action: 'view',    title: 'View Alert' },
      { action: 'dismiss', title: 'Dismiss'    },
    ],
  };

  await self.registration.showNotification(title || 'WeatherGPT Alert', notificationOptions);
}

// ─── Notification Click ────────────────────────────────────────────────────────
//
// When the user taps the OS notification:
//  1. Close the notification
//  2. Focus an existing WeatherGPT window if available
//  3. Otherwise open WeatherGPT at the relevant alert URL
//
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  const alertPath = data.url || (data.alertId ? `/alerts/${data.alertId}` : '/');
  const targetUrl = `${APP_ORIGIN}${alertPath}`;

  event.waitUntil(focusOrOpenWeatherGPT(targetUrl));
});

async function focusOrOpenWeatherGPT(targetUrl) {
  // Find any existing WeatherGPT window/tab
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  // Prefer a window already showing WeatherGPT
  for (const client of clients) {
    if (client.url.startsWith(APP_ORIGIN)) {
      await client.focus();
      // Navigate to the alert detail page
      client.postMessage({ type: 'NAVIGATE', url: targetUrl });
      return;
    }
  }

  // No existing window — open a new one
  await self.clients.openWindow(targetUrl);
}
