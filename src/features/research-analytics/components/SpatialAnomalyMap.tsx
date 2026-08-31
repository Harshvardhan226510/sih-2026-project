import React, { useState } from 'react';
import { MapPin, Globe, Filter, Layers, Flame, CheckCircle, Info } from 'lucide-react';
import { WeatherMetric } from '../types/analytics.js';

interface RegionalPoint {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  observed: number;
  baseline: number;
  anomalyPercent: number;
  extremeEvents: number;
  status: 'EXTREME' | 'HIGH' | 'ABOVE' | 'NORMAL' | 'DEFICIT';
}

const INDIAN_REGION_DATA: Record<string, RegionalPoint[]> = {
  rainfall: [
    { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, observed: 842, baseline: 710, anomalyPercent: 18.6, extremeEvents: 14, status: 'ABOVE' },
    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, observed: 2450, baseline: 1800, anomalyPercent: 36.1, extremeEvents: 22, status: 'HIGH' },
    { id: 'delhi', name: 'Delhi', state: 'Delhi NCR', lat: 28.6139, lon: 77.2090, observed: 790, baseline: 650, anomalyPercent: 21.5, extremeEvents: 8, status: 'ABOVE' },
    { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, observed: 980, baseline: 920, anomalyPercent: 6.5, extremeEvents: 5, status: 'NORMAL' },
    { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, observed: 1380, baseline: 1100, anomalyPercent: 25.4, extremeEvents: 11, status: 'HIGH' },
    { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, observed: 1720, baseline: 1650, anomalyPercent: 4.2, extremeEvents: 9, status: 'NORMAL' },
    { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, observed: 820, baseline: 750, anomalyPercent: 9.3, extremeEvents: 6, status: 'NORMAL' },
    { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, observed: 1150, baseline: 700, anomalyPercent: 64.3, extremeEvents: 17, status: 'EXTREME' },
    { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, observed: 520, baseline: 580, anomalyPercent: -10.3, extremeEvents: 3, status: 'DEFICIT' },
    { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734, observed: 1450, baseline: 1200, anomalyPercent: 20.8, extremeEvents: 15, status: 'ABOVE' },
    { id: 'kochi', name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673, observed: 3100, baseline: 2900, anomalyPercent: 6.9, extremeEvents: 19, status: 'NORMAL' }
  ],
  temperature: [
    { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, observed: 27.4, baseline: 26.8, anomalyPercent: 2.2, extremeEvents: 6, status: 'NORMAL' },
    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, observed: 28.6, baseline: 27.9, anomalyPercent: 2.5, extremeEvents: 4, status: 'NORMAL' },
    { id: 'delhi', name: 'Delhi', state: 'Delhi NCR', lat: 28.6139, lon: 77.2090, observed: 33.2, baseline: 30.5, anomalyPercent: 8.8, extremeEvents: 18, status: 'HIGH' },
    { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, observed: 34.5, baseline: 31.2, anomalyPercent: 10.5, extremeEvents: 16, status: 'HIGH' },
    { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, observed: 35.1, baseline: 31.8, anomalyPercent: 10.3, extremeEvents: 19, status: 'HIGH' },
    { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734, observed: 16.8, baseline: 14.5, anomalyPercent: 15.8, extremeEvents: 7, status: 'HIGH' },
    { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, observed: 24.8, baseline: 24.2, anomalyPercent: 2.4, extremeEvents: 2, status: 'NORMAL' }
  ]
};

export const SpatialAnomalyMap: React.FC = () => {
  const [metric, setMetric] = useState<WeatherMetric>('rainfall');
  const [mapMode, setMapMode] = useState<'anomaly' | 'observed' | 'extremes'>('anomaly');
  const [selectedPoint, setSelectedPoint] = useState<RegionalPoint | null>(INDIAN_REGION_DATA.rainfall[0]);

  const points = INDIAN_REGION_DATA[metric === 'temperature' ? 'temperature' : 'rainfall'] || INDIAN_REGION_DATA.rainfall;
  const unit = metric === 'temperature' ? '°C' : 'mm';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXTREME': return 'bg-rose-500 text-white border-rose-400 ring-rose-500/30';
      case 'HIGH': return 'bg-amber-500 text-white border-amber-400 ring-amber-500/30';
      case 'ABOVE': return 'bg-emerald-500 text-white border-emerald-400 ring-emerald-500/30';
      case 'DEFICIT': return 'bg-cyan-500 text-white border-cyan-400 ring-cyan-500/30';
      default: return 'bg-blue-600 text-white border-blue-400 ring-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Filter & Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Regional Climatological & Anomaly Spatial Distribution
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Spatial distribution across Indian meteorological zones with IMD reference baselines
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Variable:</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as WeatherMetric)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="rainfall">Rainfall (mm)</option>
              <option value="temperature">Temperature (°C)</option>
            </select>
          </div>

          {/* Map Layer Mode */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMapMode('anomaly')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapMode === 'anomaly' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Anomaly %
            </button>
            <button
              onClick={() => setMapMode('observed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapMode === 'observed' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Observed ({unit})
            </button>
            <button
              onClick={() => setMapMode('extremes')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapMode === 'extremes' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Extreme Events
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Spatial Grid & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Regional Weather Spatial Board */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Indian Regional Meteorological Grid
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &gt;+50% Extreme</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> +25% High</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Normal</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Deficit</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {points.map((pt) => {
              const isSelected = selectedPoint?.id === pt.id;
              return (
                <div
                  key={pt.id}
                  onClick={() => setSelectedPoint(pt)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-200 text-sm flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        {pt.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{pt.state}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${getStatusColor(pt.status)}`}>
                      {pt.anomalyPercent > 0 ? `+${pt.anomalyPercent}%` : `${pt.anomalyPercent}%`}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans">OBSERVED</div>
                      <div className="font-bold text-slate-200">{pt.observed} {unit}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-sans">BASELINE</div>
                      <div className="font-bold text-slate-400">{pt.baseline} {unit}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Drill-down Inspector Card */}
        {selectedPoint && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  {selectedPoint.name} Regional Profile
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {selectedPoint.lat}° N, {selectedPoint.lon}° E
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 font-medium">Climatological Anomaly</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {selectedPoint.anomalyPercent > 0 ? `+${selectedPoint.anomalyPercent}%` : `${selectedPoint.anomalyPercent}%`}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Departure: {Number((selectedPoint.observed - selectedPoint.baseline).toFixed(1))} {unit} from normal
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 font-medium">Extreme Weather Events</div>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                    {selectedPoint.extremeEvents} Events
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Surpasses 95th climatological percentile threshold
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    Spatial Context
                  </div>
                  {selectedPoint.name} ({selectedPoint.state}) reflects {selectedPoint.anomalyPercent > 20 ? 'high positive anomalies linked to strong synoptic monsoon forcing' : 'stable atmospheric conditions consistent with regional long-term averages'}.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              Source: Open-Meteo ERA5 Reanalysis Grid / IMD Normal
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
