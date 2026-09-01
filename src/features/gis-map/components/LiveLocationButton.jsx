import React, { useState, useCallback } from 'react';
import { Crosshair, Loader2 } from 'lucide-react';
import { useWeather } from '../../../context/WeatherContext';

export const LiveLocationButton = () => {
  const [locating, setLocating] = useState(false);
  const { setSelectedLocation, setUserLiveLocation } = useWeather();

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        let name = 'My Location';
        let region = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;

        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1`
          );
          const data = await res.json();
          if (data?.results?.[0]) {
            name = data.results[0].name;
            region = data.results[0].admin1 || data.results[0].country || region;
          }
        } catch {}

        const liveData = { lat, lon, name, region, country: 'India' };
        setUserLiveLocation(liveData);
        setSelectedLocation(liveData);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setSelectedLocation, setUserLiveLocation]);

  return (
    <button
      className="live-location-btn"
      onClick={handleLocate}
      disabled={locating}
      title="Track My Live Location"
    >
      {locating ? (
        <Loader2 size={18} className="animate__animated animate__rotateIn animate__infinite" />
      ) : (
        <Crosshair size={18} />
      )}
      <span>{locating ? 'Locating...' : 'My Location'}</span>
    </button>
  );
};
