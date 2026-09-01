import React from 'react';
import { 
  Layers, CloudRain, Thermometer, Wind, AlertTriangle, 
  Disc, Cloud, Map, Eye, Check, X, Compass, Globe
} from 'lucide-react';

export const LayerSelector = ({ layers, setLayers, mapStyle, setMapStyle, onClose }) => {
  const toggleLayer = (key) => {
    setLayers((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const mapStyles = [
    {
      id: 'mapbox-streets',
      label: 'Default Streets',
      desc: 'Standard clean map with landmarks',
      icon: Map,
      bg: 'linear-gradient(135deg, #1e293b, #334155)'
    },
    {
      id: 'mapbox-satellite',
      label: 'Satellite View',
      desc: 'High-res earth imagery',
      icon: Globe,
      bg: 'linear-gradient(135deg, #064e3b, #0f172a)'
    },
    {
      id: 'mapbox-dark',
      label: 'Dark Canvas',
      desc: 'High contrast night mode',
      icon: Eye,
      bg: 'linear-gradient(135deg, #020617, #1e1b4b)'
    },
    {
      id: 'mapbox-terrain',
      label: 'Topography',
      desc: 'Elevation & mountain contours',
      icon: Compass,
      bg: 'linear-gradient(135deg, #78350f, #1e293b)'
    }
  ];

  return (
    <div className="gmaps-layer-modal animate__animated animate__fadeIn">
      <div className="layer-modal-header">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 m-0">Map Type & Weather Layers</h3>
            <p className="text-[11px] text-slate-400 m-0">Customize overlays & spatial intelligence</p>
          </div>
        </div>
        {onClose && (
          <button className="layer-close-btn" onClick={onClose} title="Close layer selector">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Map Base Styles Grid */}
      <div className="layer-section">
        <span className="section-label">Map Style</span>
        <div className="map-style-grid">
          {mapStyles.map((style) => {
            const Icon = style.icon;
            const isSelected = mapStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setMapStyle(style.id)}
                className={`style-tile-btn ${isSelected ? 'selected' : ''}`}
                style={{ background: style.bg }}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Icon size={16} className={isSelected ? 'text-sky-300' : 'text-slate-300'} />
                  {isSelected && <Check size={14} className="text-sky-300 font-bold" />}
                </div>
                <span className="style-tile-label">{style.label}</span>
                <span className="style-tile-desc">{style.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weather & Hazard Overlays */}
      <div className="layer-section">
        <span className="section-label">Real-Time Weather & Hazard Overlays</span>
        <div className="layer-options-stack">
          {/* SACHET / NDMA Alerts */}
          <label className={`layer-switch-row ${layers.alerts ? 'active' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="layer-icon-pill red">
                <AlertTriangle size={15} />
              </div>
              <div className="flex flex-col">
                <span className="layer-name">SACHET / NDMA Severe Alerts</span>
                <span className="layer-hint">Pulsing danger perimeters & flood warnings</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-tag red">GOVT</span>
              <input
                type="checkbox"
                className="gmaps-toggle-checkbox"
                checked={layers.alerts}
                onChange={() => toggleLayer('alerts')}
              />
            </div>
          </label>

          {/* Precipitation Radar */}
          <label className={`layer-switch-row ${layers.radar ? 'active' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="layer-icon-pill blue">
                <CloudRain size={15} />
              </div>
              <div className="flex flex-col">
                <span className="layer-name">Precipitation Doppler Radar</span>
                <span className="layer-hint">Live rain and cloud reflectivity</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-tag blue">LIVE</span>
              <input
                type="checkbox"
                className="gmaps-toggle-checkbox"
                checked={layers.radar}
                onChange={() => toggleLayer('radar')}
              />
            </div>
          </label>

          {/* Temperature Heatmap */}
          <label className={`layer-switch-row ${layers.temperature ? 'active' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="layer-icon-pill orange">
                <Thermometer size={15} />
              </div>
              <div className="flex flex-col">
                <span className="layer-name">Thermal Heatmap</span>
                <span className="layer-hint">OpenWeather surface temperatures</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-tag orange">OWM</span>
              <input
                type="checkbox"
                className="gmaps-toggle-checkbox"
                checked={layers.temperature}
                onChange={() => toggleLayer('temperature')}
              />
            </div>
          </label>

          {/* Wind Vectors */}
          <label className={`layer-switch-row ${layers.wind ? 'active' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="layer-icon-pill green">
                <Wind size={15} />
              </div>
              <div className="flex flex-col">
                <span className="layer-name">Wind Direction & Speed</span>
                <span className="layer-hint">Dynamic particle stream vectors</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-tag green">SPEED</span>
              <input
                type="checkbox"
                className="gmaps-toggle-checkbox"
                checked={layers.wind}
                onChange={() => toggleLayer('wind')}
              />
            </div>
          </label>

          {/* Clouds Layer */}
          <label className={`layer-switch-row ${layers.clouds ? 'active' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="layer-icon-pill sky">
                <Cloud size={15} />
              </div>
              <div className="flex flex-col">
                <span className="layer-name">Global Cloud Cover</span>
                <span className="layer-hint">Infrared satellite cloud optical depth</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-tag sky">OWM</span>
              <input
                type="checkbox"
                className="gmaps-toggle-checkbox"
                checked={layers.clouds}
                onChange={() => toggleLayer('clouds')}
              />
            </div>
          </label>

          {/* Cyclone Track */}
          <label className={`layer-switch-row ${layers.cyclone ? 'active' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="layer-icon-pill amber">
                <Disc size={15} className="animate-spin" />
              </div>
              <div className="flex flex-col">
                <span className="layer-name">Cyclone Trajectory & Cone</span>
                <span className="layer-hint">Forecast track with pressure millibars</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-tag amber">IMD TRACK</span>
              <input
                type="checkbox"
                className="gmaps-toggle-checkbox"
                checked={layers.cyclone}
                onChange={() => toggleLayer('cyclone')}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LayerSelector;
