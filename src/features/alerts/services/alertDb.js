import { openDB } from 'idb';
const DB_NAME = 'weathergpt-alerts';
const DB_VERSION = 1;
let dbPromise = null;
function getDbPromise() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('alerts')) {
          const store = db.createObjectStore('alerts', { keyPath: 'id' });
          store.createIndex('severity', 'severity');
          store.createIndex('event', 'event');
          store.createIndex('areaCode', 'areaCode');
          store.createIndex('status', 'status');
          store.createIndex('updatedAt', 'updatedAt');
          store.createIndex('expiresAt', 'expiresAt');
        }
        if (!db.objectStoreNames.contains('syncState')) {
          db.createObjectStore('syncState', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}
export async function getAllAlerts() {
  const db = await getDbPromise();
  return db.getAll('alerts');
}
export async function putAlerts(alerts) {
  const db = await getDbPromise();
  const tx = db.transaction('alerts', 'readwrite');
  for (const alert of alerts) {
    await tx.store.put(alert);
  }
  await tx.done;
}
export async function removeAlerts(ids) {
  const db = await getDbPromise();
  const tx = db.transaction('alerts', 'readwrite');
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
}
export async function getLocalRevision() {
  const db = await getDbPromise();
  const state = await db.get('syncState', 'current');
  return state?.revision || 0;
}
export async function setLocalRevision(revision) {
  const db = await getDbPromise();
  await db.put('syncState', { id: 'current', revision, lastSync: new Date().toISOString() });
}

export async function applySyncDelta(alerts, removedIds, revision) {
  const db = await getDbPromise();
  const tx = db.transaction(['alerts', 'syncState'], 'readwrite');
  
  const alertsStore = tx.objectStore('alerts');
  for (const alert of alerts) {
    await alertsStore.put(alert);
  }
  
  for (const id of removedIds) {
    await alertsStore.delete(id);
  }
  
  const syncStore = tx.objectStore('syncState');
  await syncStore.put({ id: 'current', revision, lastSync: new Date().toISOString() });
  
  await tx.done;
}

export async function getLastSyncTime() {
  const db = await getDbPromise();
  const state = await db.get('syncState', 'current');
  return state?.lastSync || null;
}
export async function clearAllData() {
  const db = await getDbPromise();
  const tx1 = db.transaction('alerts', 'readwrite');
  await tx1.store.clear();
  await tx1.done;
  const tx2 = db.transaction('syncState', 'readwrite');
  await tx2.store.clear();
  await tx2.done;
}

export async function getUserLocation() {
  const db = await getDbPromise();
  const state = await db.get('meta', 'userState');
  const district = await db.get('meta', 'userDistrict');
  const source = await db.get('meta', 'locationSource');
  const lat = await db.get('meta', 'userLat');
  const lon = await db.get('meta', 'userLon');
  const accuracy = await db.get('meta', 'userAccuracy');

  return {
    state: state?.value || '',
    district: district?.value || '',
    source: source?.value || 'manual',
    latitude: lat?.value || null,
    longitude: lon?.value || null,
    accuracy: accuracy?.value || null,
  };
}

export async function setUserLocation(state, district, opts = {}) {
  const db = await getDbPromise();
  const tx = db.transaction('meta', 'readwrite');
  await tx.store.put({ key: 'userState', value: state });
  await tx.store.put({ key: 'userDistrict', value: district });
  
  if (opts.source) {
    await tx.store.put({ key: 'locationSource', value: opts.source });
  } else {
    // Default to manual if not specified
    await tx.store.put({ key: 'locationSource', value: 'manual' });
  }

  if (opts.latitude !== undefined) await tx.store.put({ key: 'userLat', value: opts.latitude });
  if (opts.longitude !== undefined) await tx.store.put({ key: 'userLon', value: opts.longitude });
  if (opts.accuracy !== undefined) await tx.store.put({ key: 'userAccuracy', value: opts.accuracy });

  await tx.done;
}

export async function setPendingLocation(latitude, longitude, accuracy) {
  const db = await getDbPromise();
  await db.put('meta', { 
    key: 'pendingLocationSync', 
    value: { latitude, longitude, accuracy, timestamp: Date.now() } 
  });
}

export async function getPendingLocation() {
  const db = await getDbPromise();
  const data = await db.get('meta', 'pendingLocationSync');
  return data?.value || null;
}

export async function clearPendingLocation() {
  const db = await getDbPromise();
  await db.delete('meta', 'pendingLocationSync');
}

export async function getDeviceId() {
  const db = await getDbPromise();
  let deviceId = await db.get('meta', 'deviceId');
  if (!deviceId) {
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    deviceId = { key: 'deviceId', value: newId };
    await db.put('meta', deviceId);
  }
  return deviceId.value;
}