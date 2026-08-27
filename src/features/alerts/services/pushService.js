/**
 * Push Notification Service (client-side)
 *
 * Manages the full Web Push subscription lifecycle in the browser.
 *
 * Flow:
 *   1. Check browser support (Notification API + PushManager)
 *   2. Request notification permission (once; never re-requests if denied)
 *   3. Get VAPID public key from server (/api/push/vapid-public-key)
 *   4. Subscribe to PushManager
 *   5. Send subscription + device location to server (/api/push/subscribe)
 *
 * Security:
 *  - Only the VAPID PUBLIC key is received from the server.
 *  - The VAPID private key is never accessible to this code.
 *  - GPS coordinates are NOT transmitted. Only state/district strings.
 *
 * Architecture:
 *  The Service Worker (sw.js) handles the actual push events.
 *  This file handles the subscription registration only.
 *  Push notifications work even when this page/tab is closed.
 *
 * Browser limitations (documented):
 *  - Safari on iOS < 16.4 does not support Web Push.
 *  - Firefox and Chrome on Android support Web Push.
 *  - Permission denial is permanent until user manually resets.
 */

const API_BASE = '/api';

/**
 * Check if Web Push is supported in this browser.
 */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Fetch the VAPID public key from the server.
 * Only the public key is ever served — the private key stays on the server.
 *
 * @returns {string|null} base64url-encoded public key
 */
async function fetchVapidPublicKey() {
  try {
    const res = await fetch(`${API_BASE}/push/vapid-public-key`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.publicKey || null;
  } catch {
    return null;
  }
}

/**
 * Convert a base64url string to a Uint8Array for use with PushManager.subscribe.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

/**
 * Get or register the service worker registration.
 * Uses the existing /sw.js — does NOT create a second Service Worker.
 *
 * @returns {ServiceWorkerRegistration|null}
 */
async function getSwRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    // Use existing registration or register if not yet registered
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (reg) return reg;
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

/**
 * Full push subscription flow.
 * Non-fatal: if any step fails (permission denied, VAPID not configured, etc.)
 * the application continues working via REST sync.
 *
 * @param {string} deviceId — device UUID from IndexedDB
 * @param {string} [state]  — user's selected state (not GPS)
 * @param {string} [district] — user's selected district (not GPS)
 * @returns {{ success: boolean, reason?: string }}
 */
export async function subscribeToPush(deviceId, state, district) {
  if (!isPushSupported()) {
    return { success: false, reason: 'Push API not supported in this browser' };
  }

  // Don't re-request if already denied
  if (Notification.permission === 'denied') {
    return { success: false, reason: 'Notification permission denied by user' };
  }

  // Request permission if not yet granted
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'Notification permission not granted' };
    }
  }

  const vapidPublicKey = await fetchVapidPublicKey();
  if (!vapidPublicKey) {
    return { success: false, reason: 'Web Push not configured on server (VAPID key missing)' };
  }

  const swReg = await getSwRegistration();
  if (!swReg) {
    return { success: false, reason: 'Service Worker not available' };
  }

  let pushSubscription;
  try {
    pushSubscription = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  } catch (err) {
    return { success: false, reason: `PushManager.subscribe failed: ${err.message}` };
  }

  // Send subscription to server
  try {
    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        subscription: pushSubscription.toJSON(),
        state: state || null,
        district: district || null,
      }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    return { success: true };
  } catch (err) {
    return { success: false, reason: `Failed to register subscription with server: ${err.message}` };
  }
}

/**
 * Unsubscribe from push notifications.
 * Removes both the browser subscription and the server record.
 */
export async function unsubscribeFromPush() {
  const swReg = await getSwRegistration();
  if (!swReg) return;

  const subscription = await swReg.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;

  await subscription.unsubscribe();

  // Notify server to remove the subscription record
  try {
    await fetch(`${API_BASE}/push/subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // Best-effort; server will clean up expired subscriptions via 410 on next delivery attempt
  }
}

/**
 * Check the current push subscription status.
 * Returns 'subscribed', 'not-subscribed', 'denied', 'unsupported'.
 */
export async function getPushStatus() {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const swReg = await getSwRegistration();
  if (!swReg) return 'not-subscribed';
  const sub = await swReg.pushManager.getSubscription();
  return sub ? 'subscribed' : 'not-subscribed';
}
