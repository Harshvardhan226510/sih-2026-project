import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapCanvas } from './components/MapCanvas';
import { LayerSelector } from './components/LayerSelector';

import { LocationSearch } from './components/LocationSearch';
import { WeatherStatsCard } from './components/WeatherStatsCard';
import { LiveLocationButton } from './components/LiveLocationButton';
import { AlertListPanel } from './components/AlertListPanel';
import { useWeather } from '../../context/WeatherContext';
import { Map, Radio, ShieldAlert } from 'lucide-react';
import './GisMapView.css';

export function GisMapView({ onNavigateToChatbot }) {
  const navigate = useNavigate();
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
    <div className="flex-1 min-h-0 w-full flex flex-col bg-slate-50 relative overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200 z-[1000]">
        <div className="flex items-center gap-2">
          <Map className="text-cyan-600" size={24} />
          <div>
            <h2 className="text-slate-800 font-bold text-lg leading-tight">GIS & Interactive Map Module</h2>
            <p className="text-slate-500 text-xs">Real-Time Spatial Weather Intelligence</p>
          </div>
        </div>

        <LocationSearch />

        <div className="flex items-center gap-4">
          <LiveLocationButton />
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
              <Radio size={14} className="animate-pulse" />
              <span>OpenWeather API (Active)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
              <ShieldAlert size={14} />
              <span>SACHET Warnings ({activeAlerts.length} Active)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full min-h-0 bg-slate-200 flex">
        
        {/* Unified Left Sidebar */}
        <div className="w-[400px] shrink-0 bg-slate-50 border-r border-slate-200 h-full flex flex-col z-[900] shadow-lg overflow-y-auto pointer-events-auto">
          <div className="p-4 border-b border-slate-200 shrink-0 bg-white">
            <LayerSelector
              layers={layers}
              setLayers={setLayers}
              mapStyle={mapStyle}
              setMapStyle={setMapStyle}
            />
          </div>
          <div className="flex-1 flex flex-col min-h-0 w-full p-4">
            <AlertListPanel />
          </div>
        </div>

        {/* Map Canvas Area */}
        <div className="flex-1 relative w-full h-full min-h-0">
          <MapCanvas
            layers={layers}
            radarFrames={radarFrames}
            currentFrameIndex={currentFrameIndex}
            opacity={opacity}
            mapStyle={mapStyle}
            onNavigateToChatbot={() => navigate('/chatbot')}
          />

          {/* Right Side Panels */}
          <div className="absolute top-4 right-4 z-[900] w-80 flex flex-col gap-4 pointer-events-none">
            <div className="pointer-events-auto flex-shrink-0">
              <WeatherStatsCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GisMapView;
