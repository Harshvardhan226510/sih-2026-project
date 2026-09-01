import { useState, useCallback } from 'react';
import { getDeviceId } from '../services/alertDb.js';

export function useGeolocation() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);

  const detectLocation = useCallback(async () => {
    setIsDetecting(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported by your browser');
        setError(err.message);
        setIsDetecting(false);
        reject(err);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            const deviceId = await getDeviceId();

            const res = await fetch('/api/devices/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceId, latitude, longitude, accuracy })
            });

            if (!res.ok) {
              throw new Error('Failed to reverse geocode location');
            }

            const data = await res.json();
            setIsDetecting(false);
            
            // Return full data including resolved state and district
            resolve({
              latitude,
              longitude,
              accuracy,
              state: data.state || '',
              district: data.district || '',
              source: 'auto'
            });
          } catch (err) {
            setError(err.message);
            setIsDetecting(false);
            reject(err);
          }
        },
        (err) => {
          let errorMessage = 'Failed to get location';
          if (err.code === 1) errorMessage = 'Location permission denied';
          if (err.code === 2) errorMessage = 'Location unavailable';
          if (err.code === 3) errorMessage = 'Location request timed out';
          
          setError(errorMessage);
          setIsDetecting(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }, []);

  return { detectLocation, isDetecting, error };
}
