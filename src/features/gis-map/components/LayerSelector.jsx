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
      bg: 'bg-slate-100 border-slate-200 text-slate-800'
    },
    {
      id: 'mapbox-satellite',
      label: 'Satellite View',
      desc: 'High-res earth imagery',
      icon: Globe,
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    },
    {
      id: 'mapbox-dark',
      label: 'Dark Canvas',
      desc: 'High contrast night mode',
      icon: Eye,
      bg: 'bg-slate-800 border-slate-700 text-slate-100'
    },
    {
      id: 'mapbox-terrain',
      label: 'Topography',
      desc: 'Elevation & mountain contours',
      icon: Compass,
      bg: 'bg-amber-50 border-amber-200 text-amber-800'
    }
  ];

  return (
    <div className="w-full bg-white rounded-2xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 m-0">Map Type & Weather Layers</h3>
            <p className="text-[11px] text-slate-500 m-0 mt-0.5">Customize overlays & spatial intelligence</p>
          </div>
        </div>
        {onClose && (
          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors" onClick={onClose} title="Close layer selector">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Map Base Styles Grid */}
      <div className="mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Map Style</span>
        <div className="grid grid-cols-2 gap-3">
          {mapStyles.map((style) => {
            const Icon = style.icon;
            const isSelected = mapStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setMapStyle(style.id)}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 shadow-sm shadow-blue-500/20 ' + style.bg : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Icon size={16} className={isSelected ? '' : 'text-slate-400'} />
                  {isSelected && <Check size={14} className="font-bold" />}
                </div>
                <span className={`text-xs font-bold ${isSelected ? '' : 'text-slate-700'}`}>{style.label}</span>
                <span className={`text-[9px] mt-0.5 leading-tight ${isSelected ? 'opacity-80' : 'text-slate-500'}`}>{style.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weather & Hazard Overlays */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Real-Time Weather & Hazard Overlays</span>
        <div className="flex flex-col gap-2">
          
          {/* SACHET / NDMA Alerts */}
          <label 
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${layers.alerts ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            onClick={(e) => { e.preventDefault(); toggleLayer('alerts'); }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${layers.alerts ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                <AlertTriangle size={16} />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${layers.alerts ? 'text-red-700' : 'text-slate-700'}`}>SACHET / NDMA Severe Alerts</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Pulsing danger perimeters & flood warnings</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${layers.alerts ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>GOVT</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${layers.alerts ? 'bg-red-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${layers.alerts ? 'left-[18px]' : 'left-0.5'}`}></div>
              </div>
            </div>
          </label>

          {/* Precipitation Radar */}
          <label 
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${layers.radar ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            onClick={(e) => { e.preventDefault(); toggleLayer('radar'); }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${layers.radar ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <CloudRain size={16} />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${layers.radar ? 'text-blue-700' : 'text-slate-700'}`}>Precipitation Doppler Radar</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Live rain and cloud reflectivity</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${layers.radar ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>LIVE</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${layers.radar ? 'bg-blue-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${layers.radar ? 'left-[18px]' : 'left-0.5'}`}></div>
              </div>
            </div>
          </label>

          {/* Temperature Heatmap */}
          <label 
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${layers.temperature ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            onClick={(e) => { e.preventDefault(); toggleLayer('temperature'); }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${layers.temperature ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                <Thermometer size={16} />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${layers.temperature ? 'text-orange-700' : 'text-slate-700'}`}>Thermal Heatmap</span>
                <span className="text-[10px] text-slate-500 mt-0.5">OpenWeather surface temperatures</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${layers.temperature ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>OWM</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${layers.temperature ? 'bg-orange-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${layers.temperature ? 'left-[18px]' : 'left-0.5'}`}></div>
              </div>
            </div>
          </label>

          {/* Wind Vectors */}
          <label 
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${layers.wind ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            onClick={(e) => { e.preventDefault(); toggleLayer('wind'); }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${layers.wind ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <Wind size={16} />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${layers.wind ? 'text-emerald-700' : 'text-slate-700'}`}>Wind Direction & Speed</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Dynamic particle stream vectors</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${layers.wind ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>SPEED</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${layers.wind ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${layers.wind ? 'left-[18px]' : 'left-0.5'}`}></div>
              </div>
            </div>
          </label>

          {/* Clouds Layer */}
          <label 
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${layers.clouds ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            onClick={(e) => { e.preventDefault(); toggleLayer('clouds'); }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${layers.clouds ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                <Cloud size={16} />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${layers.clouds ? 'text-sky-700' : 'text-slate-700'}`}>Global Cloud Cover</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Infrared satellite cloud optical depth</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${layers.clouds ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>OWM</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${layers.clouds ? 'bg-sky-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${layers.clouds ? 'left-[18px]' : 'left-0.5'}`}></div>
              </div>
            </div>
          </label>

          {/* Cyclone Track */}
          <label 
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${layers.cyclone ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            onClick={(e) => { e.preventDefault(); toggleLayer('cyclone'); }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${layers.cyclone ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <Disc size={16} className={layers.cyclone ? 'animate-spin' : ''} />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${layers.cyclone ? 'text-amber-700' : 'text-slate-700'}`}>Cyclone Trajectory & Cone</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Forecast track with pressure millibars</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${layers.cyclone ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>IMD TRACK</span>
              <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${layers.cyclone ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${layers.cyclone ? 'left-[18px]' : 'left-0.5'}`}></div>
              </div>
            </div>
          </label>

        </div>
      </div>
    </div>
  );
};

export default LayerSelector;
