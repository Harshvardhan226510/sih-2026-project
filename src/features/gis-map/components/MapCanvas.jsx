import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'animate.css';
import { useWeather } from '../../../context/WeatherContext';
import { CycloneOverlay } from './CycloneOverlay';
import { WindDirectionLayer } from './WindDirectionLayer';
import { MapCropTool } from './MapCropTool';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const OWM_API_KEY = '1690b9beed53f2415e79f37f1133e600';

export const MapCanvas = ({ layers, radarFrames, currentFrameIndex, opacity, mapStyle, onNavigateToChatbot }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const baseTileLayerRef = useRef(null);
  const radarLayerRef = useRef(null);
  const tempLayerRef = useRef(null);
  const windLayerRef = useRef(null);
  const cloudLayerRef = useRef(null);
  const markerRef = useRef(null);
  const liveMarkerRef = useRef(null);
  const alertLayersRef = useRef([]);
  const initialFlyDoneRef = useRef(false);

  const { selectedLocation, setSelectedLocation, userLiveLocation, activeAlerts } = useWeather();

  const getTileUrl = (style) => {
    switch (style) {
      case 'mapbox-satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'mapbox-dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'mapbox-streets':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const southWest = L.latLng(-60, -180);
    const northEast = L.latLng(85, 180);
    const worldBounds = L.latLngBounds(southWest, northEast);

    const map = L.map(mapContainerRef.current, {
      center: [selectedLocation.lat || 20.5937, selectedLocation.lon || 78.9629],
      zoom: 5,
      zoomControl: false,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 3
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = getTileUrl(mapStyle);
    const baseTile = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      noWrap: true,
      bounds: worldBounds
    }).addTo(map);

    baseTileLayerRef.current = baseTile;

    const marker = L.marker([selectedLocation.lat, selectedLocation.lon]).addTo(map);
    marker.bindPopup(`<b>${selectedLocation.name}</b><br/>${selectedLocation.region}`).openPopup();
    markerRef.current = marker;

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);

      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lng.toFixed(2)}&count=1`
        );
        const data = await res.json();
        const name = data?.results?.[0]?.name || `Point (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`;
        const region = data?.results?.[0]?.admin1 || 'India';

        setSelectedLocation({
          lat,
          lon: lng,
          name,
          region,
          country: 'India'
        });

        marker.bindPopup(`<b>${name}</b><br/>Lat: ${lat.toFixed(2)}°, Lon: ${lng.toFixed(2)}°`).openPopup();
      } catch {
        setSelectedLocation({
          lat,
          lon: lng,
          name: `Selected Coordinates`,
          region: `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`,
          country: 'India'
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (baseTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    }

    const southWest = L.latLng(-60, -180);
    const northEast = L.latLng(85, 180);
    const worldBounds = L.latLngBounds(southWest, northEast);

    const newTile = L.tileLayer(getTileUrl(mapStyle), {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      noWrap: true,
      bounds: worldBounds
    }).addTo(mapInstanceRef.current);

    baseTileLayerRef.current = newTile;
  }, [mapStyle]);

  useEffect(() => {
    if (!mapInstanceRef.current || !userLiveLocation) return;

    if (liveMarkerRef.current) {
      liveMarkerRef.current.setLatLng([userLiveLocation.lat, userLiveLocation.lon]);
    } else {
      const liveIcon = L.divIcon({
        className: 'live-location-marker-icon',
        html: `<div class="live-marker-wrapper">` +
          `<div class="live-marker-pulse animate__animated animate__pulse animate__infinite"></div>` +
          `<div class="live-marker-dot"></div>` +
          `</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const liveM = L.marker([userLiveLocation.lat, userLiveLocation.lon], {
        icon: liveIcon,
        zIndexOffset: 1000
      }).addTo(mapInstanceRef.current);

      liveM.bindPopup(
        `<div style="font-family:Inter,system-ui,sans-serif;min-width:150px">` +
        `<div style="font-weight:700;font-size:13px;color:#3b82f6;margin-bottom:4px">📍 You Are Here</div>` +
        `<div style="font-size:12px">${userLiveLocation.name}</div>` +
        `<div style="font-size:11px;color:#94a3b8">${userLiveLocation.region}</div>` +
        `</div>`
      );

      liveMarkerRef.current = liveM;
    }

    if (!initialFlyDoneRef.current) {
      mapInstanceRef.current.flyTo([userLiveLocation.lat, userLiveLocation.lon], 7, {
        duration: 1.5
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([userLiveLocation.lat, userLiveLocation.lon]);
        markerRef.current.bindPopup(`<b>${userLiveLocation.name}</b><br/>${userLiveLocation.region}`).openPopup();
      }

      initialFlyDoneRef.current = true;
    }
  }, [userLiveLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation?.lat || !selectedLocation?.lon) return;
    if (!initialFlyDoneRef.current && !userLiveLocation) {
      return;
    }

    mapInstanceRef.current.flyTo([selectedLocation.lat, selectedLocation.lon], 8, {
      duration: 1.2
    });
    if (markerRef.current) {
      markerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lon]);
      markerRef.current.bindPopup(`<b>${selectedLocation.name}</b><br/>${selectedLocation.region}`).openPopup();
    }
  }, [selectedLocation.lat, selectedLocation.lon]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (radarLayerRef.current) {
      mapInstanceRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (layers.radar && radarFrames.length > 0 && radarFrames[currentFrameIndex]) {
      const frame = radarFrames[currentFrameIndex];
      const radarUrl = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

      const radarLayer = L.tileLayer(radarUrl, {
        opacity: opacity,
        tileSize: 256,
        maxNativeZoom: 6,
        maxZoom: 19,
        zIndex: 500
      });

      radarLayer.addTo(mapInstanceRef.current);
      radarLayerRef.current = radarLayer;
    }
  }, [layers.radar, currentFrameIndex, radarFrames, opacity]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tempLayerRef.current) {
      mapInstanceRef.current.removeLayer(tempLayerRef.current);
      tempLayerRef.current = null;
    }

    if (layers.temperature) {
      const owmTempUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`;
      const tempLayer = L.tileLayer(owmTempUrl, {
        opacity: 1.0,
        tileSize: 256,
        maxZoom: 19,
        zIndex: 400,
        className: 'owm-thermal-tile-layer'
      });
      tempLayer.addTo(mapInstanceRef.current);
      tempLayerRef.current = tempLayer;
    }
  }, [layers.temperature]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (windLayerRef.current) {
      mapInstanceRef.current.removeLayer(windLayerRef.current);
      windLayerRef.current = null;
    }

    if (layers.wind) {
      const owmWindUrl = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`;
      const windLayer = L.tileLayer(owmWindUrl, {
        opacity: 0.95,
        tileSize: 256,
        maxZoom: 19,
        zIndex: 410,
        className: 'owm-wind-tile-layer'
      });
      windLayer.addTo(mapInstanceRef.current);
      windLayerRef.current = windLayer;
    }
  }, [layers.wind]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (cloudLayerRef.current) {
      mapInstanceRef.current.removeLayer(cloudLayerRef.current);
      cloudLayerRef.current = null;
    }

    if (layers.clouds) {
      const owmCloudUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`;
      const cloudLayer = L.tileLayer(owmCloudUrl, {
        opacity: 0.9,
        tileSize: 256,
        maxZoom: 19,
        zIndex: 420
      });
      cloudLayer.addTo(mapInstanceRef.current);
      cloudLayerRef.current = cloudLayer;
    }
  }, [layers.clouds]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    alertLayersRef.current.forEach((layer) => mapInstanceRef.current.removeLayer(layer));
    alertLayersRef.current = [];

    if (layers.alerts && activeAlerts.length > 0) {
      activeAlerts.forEach((alert) => {
        if (!alert.lat || !alert.lon) return;

        let badgeBg = '#ea580c';
        let emoji = '⚠️';
        if (alert.severity === 'RED') {
          badgeBg = '#dc2626';
          emoji = '🚨';
        } else if (alert.severity === 'YELLOW') {
          badgeBg = '#ca8a04';
          emoji = '🌧️';
        }

        if (alert.category === 'flood') emoji = '🌊';
        if (alert.category === 'thunderstorm') emoji = '⚡';
        if (alert.category === 'heatwave') emoji = '🔥';
        if (alert.category === 'marine') emoji = '⚓';

        const alertIcon = L.divIcon({
          className: 'sachet-alert-marker-icon',
          html: `<div class="sachet-marker-pin" style="background-color: ${badgeBg}">` +
            `<span class="sachet-marker-emoji">${emoji}</span>` +
            `</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const alertMarker = L.marker([alert.lat, alert.lon], { icon: alertIcon }).addTo(mapInstanceRef.current);

        alertMarker.bindPopup(
          `<div style="font-family:Inter,system-ui,sans-serif;max-width:240px">` +
          `<div style="font-weight:700;font-size:13px;color:${badgeBg};margin-bottom:4px">${emoji} ${alert.severity} ALERT</div>` +
          `<div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px">${alert.title}</div>` +
          `<div style="font-size:11px;color:#64748b;margin-bottom:6px"><b>Region:</b> ${alert.region}</div>` +
          `<div style="font-size:11px;color:#334155;background:#f1f5f9;padding:6px;border-radius:6px">${alert.description}</div>` +
          `<div style="font-size:10px;color:#94a3b8;margin-top:6px">Issuer: ${alert.issuer}</div>` +
          `</div>`
        );

        alertMarker.on('click', () => {
          setSelectedLocation({
            lat: alert.lat,
            lon: alert.lon,
            name: alert.title,
            region: alert.region,
            country: 'India'
          });
        });

        alertLayersRef.current.push(alertMarker);
      });
    }
  }, [layers.alerts, activeAlerts]);

  return (
    <>
      <div ref={mapContainerRef} className="gis-map-canvas" />
      {layers.cyclone && mapInstanceRef.current && (
        <CycloneOverlay map={mapInstanceRef.current} />
      )}
      {layers.wind && mapInstanceRef.current && (
        <WindDirectionLayer map={mapInstanceRef.current} />
      )}
      {mapInstanceRef.current && (
        <MapCropTool
          map={mapInstanceRef.current}
          onNavigateToChatbot={onNavigateToChatbot}
          activeLayers={layers}
        />
      )}
    </>
  );
};
