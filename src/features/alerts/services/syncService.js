import * as db from './alertDb.js';
import * as api from './alertApi.js';
export async function performSync(networkProfile = 'fast') {
  const localRevision = await db.getLocalRevision();
  const location = await db.getUserLocation();
  const deviceId = await db.getDeviceId();

  // Process any pending offline location changes first
  const pendingLoc = await db.getPendingLocation();
  if (pendingLoc) {
    try {
      const res = await api.updateDeviceLocation(deviceId, pendingLoc.latitude, pendingLoc.longitude, pendingLoc.accuracy);
      if (res && res.state && res.district) {
        // We received authoritative reverse-geocoded state/district
        location.state = res.state;
        location.district = res.district;
        // Also update local cache so other components see the resolved name
        await db.setUserLocation(res.state, res.district, {
          source: 'auto',
          latitude: pendingLoc.latitude,
          longitude: pendingLoc.longitude,
          accuracy: pendingLoc.accuracy
        });
      }
      await db.clearPendingLocation();
    } catch (err) {
      console.error('[Sync] Failed to sync pending location:', err);
    }
  }

  // Register device on each sync attempt to ensure server has latest location string
  api.registerDevice(deviceId, location.state, location.district).catch(console.error);

  let data;
  if (localRevision === 0) {
    data = await api.fetchBootstrap();
  } else {
    data = await api.fetchSync(localRevision, null, {
      state: location.state,
      district: location.district,
      networkProfile,
      deviceId
    });
    if (data === null) return { updated: false };
  }
  
  // Combine delta alerts and pending deliveries for processing
  const rawAlerts = data.alerts || [];
  const pendingDeliveries = data.pendingDeliveries || [];
  const pendingIds = new Set(pendingDeliveries.map(p => p.id));
  
  const allIncoming = [...rawAlerts];
  for (const p of pendingDeliveries) {
    if (!allIncoming.some(a => a.id === p.id)) {
      allIncoming.push(p);
    }
  }

  if (allIncoming.length > 0) {
    const normalizedAlerts = allIncoming.map(a => {
      if (a.s) {
        return {
          id: a.id,
          severity: a.s,
          event: a.e,
          area: a.a,
          expiresAt: a.x,
          status: 'ACTIVE'
        };
      }
      return a;
    });
    await db.putAlerts(normalizedAlerts);
    
    // Send ACKs for pending deliveries
    for (const pendingId of pendingIds) {
      api.acknowledgeAlert(deviceId, pendingId).catch(console.error);
    }
    // Note: OS-level notifications are handled by the Service Worker push event handler
    // (sw.js) via Web Push, which works even when this page/tab is closed.
    // The inline Notification() call has been intentionally removed to prevent
    // duplicate notifications when both push and REST sync deliver the same alert.
  }
  if (data.removed && data.removed.length > 0) {
    await db.removeAlerts(data.removed);
  }
  if (data.activeIds) {
    const allLocal = await db.getAllAlerts();
    const localActive = allLocal.filter(a => a.status === 'ACTIVE');
    const serverActiveSet = new Set(data.activeIds);
    const toRemove = [];
    for (const local of localActive) {
      if (!serverActiveSet.has(local.id)) {
        const isUpdated = allIncoming.some(a => a.id === local.id);
        if (!isUpdated) {
          toRemove.push(local.id);
        }
      }
    }
    if (toRemove.length > 0) {
      await db.removeAlerts(toRemove);
    }
  }
  await db.setLocalRevision(data.revision);
  return { updated: true, revision: data.revision, newAlerts: data.alerts?.length || 0 };
}
export async function loadCachedAlerts() {
  return db.getAllAlerts();
}
export async function getSyncInfo() {
  const revision = await db.getLocalRevision();
  const lastSync = await db.getLastSyncTime();
  return { revision, lastSync };
}