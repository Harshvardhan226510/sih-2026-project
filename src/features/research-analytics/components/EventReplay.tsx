import React, { useState, useEffect } from 'react';
import { HistoricalEventReplayResponse } from '../types/analytics.js';
import { fetchEventReplay } from '../services/analyticsApi.js';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Play, RotateCcw, AlertTriangle, ShieldAlert, Activity, Flame, Wind, Clock } from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

export const EventReplay: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>('mumbai-2005-deluge');
  const [replayData, setReplayData] = useState<HistoricalEventReplayResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchEventReplay(selectedEventId)
      .then((res) => {
        if (mounted) {
          setReplayData(res);
          setActiveStep(res.timeline.length - 1);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load event replay:', err);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [selectedEventId]);

  // Autoplay Scrubber
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && replayData) {
      timer = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= replayData.timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, replayData]);

  if (loading || !replayData) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const currentStep = replayData.timeline[activeStep] || replayData.timeline[replayData.timeline.length - 1];

  const getWarningBadge = (level: string) => {
    switch (level) {
      case 'RED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-300 border border-rose-700 animate-pulse">RED WARNING</span>;
      case 'ORANGE':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-950 text-orange-300 border border-orange-700">ORANGE ALERT</span>;
      case 'YELLOW':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-950 text-amber-300 border border-amber-700">YELLOW WATCH</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-700">GREEN NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Selector & Scrubber Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Historical Severe Event Synoptic Replay
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {replayData.eventName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Location: {replayData.location} • Case Study Window: {replayData.startDate} → {replayData.endDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="mumbai-2005-deluge">2005 Mumbai Deluge (944 mm)</option>
              <option value="pune-2019-flash-flood">2019 Pune Cloudburst & Flash Flood (281 mm)</option>
              <option value="cyclone-biparjoy-2023">2023 Cyclone Biparjoy Landfall (125 km/h)</option>
              <option value="delhi-2022-heatwave">2022 Northern India Heatwave (49.2 °C)</option>
            </select>

            <button
              onClick={() => {
                if (activeStep >= replayData.timeline.length - 1) setActiveStep(0);
                setIsPlaying(!isPlaying);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isPlaying ? 'Pause' : 'Replay Event'}
            </button>
          </div>
        </div>

        {/* Timeline Interactive Scrubber */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Scrubber Timestamp: <span className="font-mono text-slate-200 font-bold">{currentStep.timestamp}</span>
            </span>
            <span>{getWarningBadge(currentStep.warningLevel)}</span>
          </div>

          <input
            type="range"
            min={0}
            max={replayData.timeline.length - 1}
            value={activeStep}
            onChange={(e) => {
              setIsPlaying(false);
              setActiveStep(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          <div className="mt-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Atmospheric Commentary: </span>
              {currentStep.commentary}
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Multi-Parameter Charts */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Synchronized Multi-Parameter Evolution
          </h3>
          <span className="text-xs text-slate-400">Precipitation (mm) • Wind (km/h) • Pressure (hPa)</span>
        </div>

        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={replayData.timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="rainfall" fill="#3b82f6" name="Precipitation (mm)" radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="windSpeed" stroke="#06b6d4" strokeWidth={2} dot={false} name="Wind Speed (km/h)" />
              <Line yAxisId="right" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} dot={false} name="Temperature (°C)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DataProvenance provenance={replayData.provenance} />
    </div>
  );
};
