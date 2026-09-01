import React, { useState, useEffect } from 'react';
import { MapCanvas } from './components/MapCanvas';
import { LayerSelector } from './components/LayerSelector';
import { RadarPlaybar } from './components/RadarPlaybar';
import { LocationSearch } from './components/LocationSearch';
import { WeatherStatsCard } from './components/WeatherStatsCard';
import { LiveLocationButton } from './components/LiveLocationButton';
import { AlertListPanel } from './components/AlertListPanel';
import { useWeather } from '../../context/WeatherContext';
import { Map, Radio, ShieldAlert } from 'lucide-react';
import './GisMapView.css';

export function GisMapView({ onNavigateToChatbot }) {
  const { activeAlerts } = useWeather();
  const [mapStyle, setMapStyle] = useState('mapbox-streets');
  const [layers, setLayers] = useState({
    radar: true,
    temperature: true,
    wind: false,
    clouds: false,
    alerts: true,
    cyclone: true
  });

  const [radarFrames, setRadarFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [opacity, setOpacity] = useState(0.75);

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.radar && data.radar.past) {
          const frames = [...data.radar.past];
          if (data.radar.nowcast) {
            frames.push(...data.radar.nowcast);
          }
          setRadarFrames(frames);
          setCurrentFrameIndex(frames.length > 0 ? frames.length - 1 : 0);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="gis-module-container">
      <div className="gis-top-bar">
        <div className="module-title-badge">
          <Map className="text-cyan-400" size={20} />
          <div>
            <h2 className="title-text">GIS & Interactive Map Module</h2>
            <p className="subtitle-text">Real-Time Spatial Weather Intelligence</p>
          </div>
        </div>

        <LocationSearch />

        <div className="top-bar-actions">
          <LiveLocationButton />
          <div className="status-pills">
            <div className="status-pill green">
              <Radio size={14} className="animate-pulse" />
              <span>OpenWeather API (Active)</span>
            </div>
            <div className="status-pill red">
              <ShieldAlert size={14} />
              <span>SACHET Warnings ({activeAlerts.length} Active)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="map-view-wrapper">
        <MapCanvas
          layers={layers}
          radarFrames={radarFrames}
          currentFrameIndex={currentFrameIndex}
          opacity={opacity}
          mapStyle={mapStyle}
          onNavigateToChatbot={onNavigateToChatbot}
        />

        <div className="floating-stats-panel">
          <WeatherStatsCard />
        </div>

        <div className="floating-left-bottom-panel">
          <AlertListPanel />
        </div>

        <div className="floating-right-column">
          <LayerSelector
            layers={layers}
            setLayers={setLayers}
            mapStyle={mapStyle}
            setMapStyle={setMapStyle}
          />
        </div>

        {layers.radar && (
          <div className="floating-playbar-panel">
            <RadarPlaybar
              radarFrames={radarFrames}
              currentFrameIndex={currentFrameIndex}
              setCurrentFrameIndex={setCurrentFrameIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              opacity={opacity}
              setOpacity={setOpacity}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default GisMapView;
