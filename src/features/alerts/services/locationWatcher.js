import { getUserLocation, setUserLocation, setPendingLocation, getDeviceId } from './alertDb.js';

let watchId = null;

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 2km threshold to avoid spamming backend for minor movements
const MOVEMENT_THRESHOLD_KM = 2.0; 

export async function processLocationUpdate(latitude, longitude, accuracy) {
  try {
    const cachedLoc = await getUserLocation();
    
    // Only process if we have a previous location to compare to, or if we want to force it
    // Wait, if it's auto but missing lat/lon, we should probably update.
    if (cachedLoc.source === 'auto' && cachedLoc.latitude && cachedLoc.longitude) {
      const distance = calculateDistance(cachedLoc.latitude, cachedLoc.longitude, latitude, longitude);
      if (distance < MOVEMENT_THRESHOLD_KM) {
        // Movement is not significant enough
        return;
      }
    }

    // Try to reach backend
    if (!navigator.onLine) {
      await setPendingLocation(latitude, longitude, accuracy);
      return;
    }

    const deviceId = await getDeviceId();
    const res = await fetch('/api/devices/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, latitude, longitude, accuracy })
    });

    if (!res.ok) {
      // Backend unavailable, store pending
      await setPendingLocation(latitude, longitude, accuracy);
      return;
    }

    const data = await res.json();
    
    // Check if administrative area actually changed
    if (data.state !== cachedLoc.state || data.district !== cachedLoc.district) {
      await setUserLocation(data.state || '', data.district || '', {
        source: 'auto',
        latitude,
        longitude,
        accuracy
      });
      
      // Dispatch event so React UI can update automatically
      window.dispatchEvent(new CustomEvent('weathergpt:location-updated', {
        detail: { state: data.state, district: data.district, source: 'auto', latitude, longitude, accuracy }
      }));
    } else {
      // Even if state/district didn't change, we should update the cached lat/lon so the distance threshold resets
      await setUserLocation(data.state || '', data.district || '', {
        source: 'auto',
        latitude,
        longitude,
        accuracy
      });
    }

  } catch (err) {
    console.error('[LocationWatcher] Error processing update:', err);
    await setPendingLocation(latitude, longitude, accuracy);
  }
}

export async function startLocationWatcher() {
  if (watchId !== null) return;
  
  if (!('geolocation' in navigator)) return;

  // Only start if the user previously explicitly granted permission and is using auto location
  try {
    const loc = await getUserLocation();
    if (loc.source !== 'auto') return;

    const permission = await navigator.permissions.query({ name: 'geolocation' });
    if (permission.state === 'granted') {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          processLocationUpdate(latitude, longitude, accuracy);
        },
        (error) => {
          console.warn('[LocationWatcher] Watch error:', error.message);
        },
        {
          enableHighAccuracy: false, // Balanced accuracy to save battery
          maximumAge: 300000, // Allow up to 5 min old cached positions from OS
          timeout: 27000 
        }
      );
      console.debug('[LocationWatcher] Started background location watcher');
    }
  } catch (err) {
    console.error('[LocationWatcher] Failed to start:', err);
  }
}

export function stopLocationWatcher() {
  if (watchId !== null && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    console.debug('[LocationWatcher] Stopped background location watcher');
  }
}

// Ensure distance calculation is testable
export { calculateDistance };
