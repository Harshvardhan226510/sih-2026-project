import React, { useState } from 'react';
import { WeatherProvider, useWeather } from './context/WeatherContext';
import { SidebarNav } from './components/SidebarNav';
import { GisMapView } from './features/gis-map/GisMapView';
import Module1View from './features/chatbot/Module1View';
import Module3View from './features/alerts/Module3View';
import { MapPin, Layers, Sparkles, X } from 'lucide-react';
import './App.css';

function ChatbotViewWrapper() {
  const { croppedSpatialContext, clearCroppedSpatialContext } = useWeather();

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {croppedSpatialContext && (
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '10px 20px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: '#cbd5e1' }}>
            <span style={{ fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} /> Attached Map Region:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={14} className="text-cyan-400" />
              <span>Center: <strong>{croppedSpatialContext.center.lat}°N, {croppedSpatialContext.center.lon}°E</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={14} className="text-emerald-400" />
              <span>Layers: <strong>{croppedSpatialContext.activeLayers.join(', ')}</strong></span>
            </div>
            {croppedSpatialContext.alertsCount > 0 && (
              <span style={{ color: '#f87171', fontWeight: 700 }}>
                🚨 {croppedSpatialContext.alertsCount} Alert(s) Attached
              </span>
            )}
          </div>

          <button onClick={clearCroppedSpatialContext} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
            <X size={14} /> Clear Attached Region
          </button>
        </div>
      )}

      <div style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
        <Module1View />
      </div>
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState('gis-map');

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'gis-map':
        return <GisMapView onNavigateToChatbot={() => setActiveTab('chatbot')} />;
      case 'chatbot':
        return <ChatbotViewWrapper />;
      case 'alerts':
        return <Module3View />;
      case 'farmer-dashboard':
        return (
          <div style={{ padding: 32, color: '#fff' }}>
            <h2>Agro-Meteorological Farmer Advisory</h2>
          </div>
        );
      case 'aviation-marine':
        return (
          <div style={{ padding: 32, color: '#fff' }}>
            <h2>Aviation & Marine Weather Briefing</h2>
          </div>
        );
      case 'research-analytics':
        return (
          <div style={{ padding: 32, color: '#fff' }}>
            <h2>Climate Trends & Research Analytics</h2>
          </div>
        );
      default:
        return <GisMapView onNavigateToChatbot={() => setActiveTab('chatbot')} />;
    }
  };

  return (
    <WeatherProvider>
      <div className="weathergpt-app">
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="module-viewport">{renderActiveModule()}</main>
      </div>
    </WeatherProvider>
  );
}

export default App;
