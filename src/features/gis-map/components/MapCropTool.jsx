import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Crop, Lock, X, MapPin, Layers, Sparkles, Check } from 'lucide-react';
import { useWeather } from '../../../context/WeatherContext';

export const MapCropTool = ({ map, onNavigateToChatbot, activeLayers }) => {
  const [isCropping, setIsCropping] = useState(false);
  const [cropBounds, setCropBounds] = useState(null);
  const rectangleRef = useRef(null);
  const { setCroppedSpatialContext, activeAlerts } = useWeather();

  useEffect(() => {
    if (!map) return;

    if (!isCropping) {
      if (rectangleRef.current) {
        map.removeLayer(rectangleRef.current);
        rectangleRef.current = null;
      }
      setCropBounds(null);
      return;
    }

    const updateRectangle = () => {
      const mapCenter = map.getCenter();
      const mapBounds = map.getBounds();
      const latSpan = (mapBounds.getNorth() - mapBounds.getSouth()) * 0.45;
      const lonSpan = (mapBounds.getEast() - mapBounds.getWest()) * 0.45;

      const newBounds = L.latLngBounds(
        [mapCenter.lat - latSpan / 2, mapCenter.lng - lonSpan / 2],
        [mapCenter.lat + latSpan / 2, mapCenter.lng + lonSpan / 2]
      );

      if (!rectangleRef.current) {
        const rect = L.rectangle(newBounds, {
          color: '#38bdf8',
          weight: 2.5,
          dashArray: '6, 6',
          fillColor: '#0284c7',
          fillOpacity: 0.16
        }).addTo(map);

        rectangleRef.current = rect;
      } else {
        rectangleRef.current.setBounds(newBounds);
      }

      setCropBounds(newBounds);
    };

    updateRectangle();

    map.on('move', updateRectangle);
    map.on('zoom', updateRectangle);

    return () => {
      map.off('move', updateRectangle);
      map.off('zoom', updateRectangle);
      if (rectangleRef.current && map) {
        map.removeLayer(rectangleRef.current);
        rectangleRef.current = null;
      }
    };
  }, [isCropping, map]);

  const handleLockAndSend = () => {
    if (!cropBounds) return;

    const sw = cropBounds.getSouthWest();
    const ne = cropBounds.getNorthEast();
    const center = cropBounds.getCenter();

    const alertsInZone = activeAlerts.filter(
      (alert) =>
        alert.lat >= sw.lat &&
        alert.lat <= ne.lat &&
        alert.lon >= sw.lng &&
        alert.lon <= ne.lng
    );

    const enabledLayerNames = Object.keys(activeLayers || {})
      .filter((key) => activeLayers[key])
      .map((key) => {
        switch (key) {
          case 'radar':
            return 'Precipitation Radar';
          case 'temperature':
            return 'Thermal Heatmap';
          case 'wind':
            return 'Wind Velocity Layer';
          case 'clouds':
            return 'Clouds Layer';
          case 'alerts':
            return 'SACHET Warnings';
          case 'cyclone':
            return 'Cyclone Track';
          default:
            return key;
        }
      });

    const spatialContextPayload = {
      timestamp: new Date().toLocaleTimeString(),
      center: { lat: center.lat.toFixed(3), lon: center.lng.toFixed(3) },
      bounds: {
        southWest: `${sw.lat.toFixed(3)}°N, ${sw.lng.toFixed(3)}°E`,
        northEast: `${ne.lat.toFixed(3)}°N, ${ne.lng.toFixed(3)}°E`
      },
      activeLayers: enabledLayerNames,
      alertsCount: alertsInZone.length,
      alertsSummary: alertsInZone.map((a) => `${a.severity}: ${a.title} (${a.region})`).join(' | '),
      suggestedPrompt: `Analyze weather patterns, thermal anomalies, and disaster risk in locked map region (${center.lat.toFixed(2)}°N, ${center.lng.toFixed(2)}°E)`
    };

    setCroppedSpatialContext(spatialContextPayload);
    setIsCropping(false);

    if (onNavigateToChatbot) {
      onNavigateToChatbot();
    }
  };

  return (
    <div className="map-crop-tool-wrapper">
      {!isCropping ? (
        <button
          className="crop-action-btn crop-start"
          onClick={() => setIsCropping(true)}
          title="Click to activate dotted region box on map"
        >
          <Crop size={18} />
          <span>Crop Map Region</span>
        </button>
      ) : (
        <div className="crop-lock-controls animate__animated animate__fadeIn">
          <button
            className="crop-action-btn crop-lock text-white"
            onClick={handleLockAndSend}
            title="Lock this region and send to WeatherGPT Chatbot"
          >
            <Lock size={18} className="animate-bounce" />
            <span>Lock Map Region</span>
          </button>
          <button
            className="crop-cancel-btn"
            onClick={() => setIsCropping(false)}
            title="Cancel cropping"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
