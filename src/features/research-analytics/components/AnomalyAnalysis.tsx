import React, { useState } from 'react';
import { AnomalyAnalyticsResponse, WeatherMetric } from '../types/analytics.js';
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
import { 
  Flame, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Sliders,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  anomalyData: AnomalyAnalyticsResponse | null;
  loading: boolean;
  selectedMetric: WeatherMetric;
  onBaselineChange?: (baseStart: string, baseEnd: string) => void;
}

export const AnomalyAnalysis: React.FC<Props> = ({ 
  anomalyData, 
  loading, 
  selectedMetric,
  onBaselineChange 
}) => {
  const [baselinePreset, setBaselinePreset] = useState<'1991_2020' | '10year_prior' | 'custom'>('1991_2020');
  const [customBaseStart, setCustomBaseStart] = useState('1991-01-01');
  const [customBaseEnd, setCustomBaseEnd] = useState('2020-12-31');
  const [anomalyFilter, setAnomalyFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'EXTREME'>('ALL');

  const unit = selectedMetric === 'rainfall' ? 'mm' : '°C';

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!anomalyData) return null;

  const isExtreme = anomalyData.classification.includes('EXTREME');
  const isHigh = anomalyData.classification.includes('HIGH');
  const isNormal = anomalyData.classification === 'NORMAL';

  const handlePresetSelect = (preset: '1991_2020' | '10year_prior' | 'custom') => {
    setBaselinePreset(preset);
    if (!onBaselineChange) return;

    if (preset === '1991_2020') {
      onBaselineChange('1991-01-01', '2020-12-31');
    } else if (preset === '10year_prior') {
      const targetStartYear = new Date(anomalyData.targetPeriod.start).getFullYear();
      onBaselineChange(`${targetStartYear - 10}-01-01`, `${targetStartYear - 1}-12-31`);
    }
  };

  const handleApplyCustomBaseline = () => {
    if (onBaselineChange) {
      onBaselineChange(customBaseStart, customBaseEnd);
    }
  };

  const filteredDetectedAnomalies = (anomalyData.detectedAnomalies || []).filter(a => {
    if (anomalyFilter === 'POSITIVE') return a.direction === 'POSITIVE';
    if (anomalyFilter === 'NEGATIVE') return a.direction === 'NEGATIVE';
    if (anomalyFilter === 'EXTREME') return a.severity === 'EXTREME';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feature 11: Configurable Baseline Period Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Climatological Baseline Reference Period
              </span>
              <p className="text-[11px] text-slate-400">
                Current: <strong className="text-slate-200">{anomalyData.baselinePeriod.baselineLabel || `${anomalyData.baselinePeriod.start} → ${anomalyData.baselinePeriod.end}`}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePresetSelect('1991_2020')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                baselinePreset === '1991_2020'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              WMO Standard (1991–2020)
            </button>
            <button
              onClick={() => handlePresetSelect('10year_prior')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                baselinePreset === '10year_prior'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              10-Year Prior Window
            </button>
            <button
              onClick={() => setBaselinePreset('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                baselinePreset === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Custom Window
            </button>
          </div>
        </div>

        {baselinePreset === 'custom' && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="date"
              value={customBaseStart}
              onChange={(e) => setCustomBaseStart(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-mono"
            />
            <span className="text-slate-500">→</span>
            <input
              type="date"
              value={customBaseEnd}
              onChange={(e) => setCustomBaseEnd(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-mono"
            />
            <button
              onClick={handleApplyCustomBaseline}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              Apply Baseline
            </button>
          </div>
        )}
      </div>

      {/* Signature Anomaly Header Card */}
      <div className={`border rounded-2xl p-6 relative overflow-hidden ${
        isExtreme
          ? 'bg-rose-950/40 border-rose-800/80 shadow-rose-950/20 shadow-lg'
          : isHigh
          ? 'bg-amber-950/40 border-amber-800/80 shadow-amber-950/20 shadow-lg'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 ${isExtreme ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Weather Anomaly Detection Engine
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              {anomalyData.location}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluation Period: <span className="font-mono text-slate-200">{anomalyData.targetPeriod.start} → {anomalyData.targetPeriod.end}</span> vs Baseline: <span className="font-mono text-slate-300">{anomalyData.baselinePeriod.start} → {anomalyData.baselinePeriod.end}</span>
            </p>
          </div>

          {/* Anomaly Badge */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2.5 rounded-xl border text-center font-mono ${
              isExtreme
                ? 'bg-rose-900/70 border-rose-700 text-rose-200'
                : isHigh
                ? 'bg-amber-900/70 border-amber-700 text-amber-200'
                : 'bg-emerald-900/70 border-emerald-700 text-emerald-200'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Classification Status
              </div>
              <div className="text-lg font-black tracking-tight mt-0.5">
                {anomalyData.badgeLabel}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards: Baseline vs Observed vs Net Anomaly */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase">Historical Baseline Normal</div>
            <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
              {anomalyData.historicalBaseline} {unit}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Reference climatological mean
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase">Evaluation Observed Value</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {anomalyData.observedValue} {unit}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Actual recorded value
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase">Net Departure & Z-Score</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${anomalyData.anomaly >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {anomalyData.anomaly > 0 ? `+${anomalyData.anomaly}` : anomalyData.anomaly} {unit}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Z-Score: <strong>{anomalyData.zScore}σ</strong> ({anomalyData.anomalyPercentage > 0 ? '+' : ''}{anomalyData.anomalyPercentage}%)
            </div>
          </div>
        </div>
      </div>

      {/* Feature 4: Automatic Anomaly Detection Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 mb-4 gap-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              Automatic Anomaly Detection Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {anomalyData.detectedAnomaliesSummary}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={anomalyFilter}
              onChange={(e) => setAnomalyFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Significant Anomalies</option>
              <option value="POSITIVE">Positive Surges (+)</option>
              <option value="NEGATIVE">Negative Deficits (-)</option>
              <option value="EXTREME">Extreme Only (|Z| ≥ 3.0σ)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] font-sans">
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Observed</th>
                <th className="pb-2.5">Baseline Reference</th>
                <th className="pb-2.5">Magnitude / Departure</th>
                <th className="pb-2.5">Z-Score</th>
                <th className="pb-2.5 font-sans">Methodology / Threshold</th>
                <th className="pb-2.5 font-sans">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDetectedAnomalies.length > 0 ? (
                filteredDetectedAnomalies.map((anom) => (
                  <tr key={anom.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-bold text-slate-200">{anom.date}</td>
                    <td className="py-2.5 text-white font-bold">{anom.observedValue} {anom.unit}</td>
                    <td className="py-2.5 text-slate-400">{anom.baselineReference} {anom.unit}</td>
                    <td className={`py-2.5 font-bold ${anom.anomalyMagnitude >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {anom.anomalyMagnitude > 0 ? `+${anom.anomalyMagnitude}` : anom.anomalyMagnitude} {anom.unit} ({anom.anomalyPercentage > 0 ? `+${anom.anomalyPercentage}` : anom.anomalyPercentage}%)
                    </td>
                    <td className="py-2.5 text-slate-300 font-bold">{anom.zScore}σ</td>
                    <td className="py-2.5 font-sans text-slate-400 text-[11px] max-w-xs truncate">
                      {anom.methodology}
                    </td>
                    <td className="py-2.5 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        anom.severity === 'EXTREME'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : anom.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}>
                        {anom.severity}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                    No anomalies matched the filter criteria for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Time-Series Anomaly Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <h3 className="text-base font-semibold text-white">
            Daily Observation vs Baseline Normal Timeline
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {anomalyData.timeSeries.length} Days Evaluated
          </span>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={anomalyData.timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(v) => v.length > 7 ? v.substring(5) : v}
              />
              <YAxis stroke="#64748b" fontSize={11} unit={unit} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '0.5rem' }}
              />
              <Legend />
              <Bar 
                dataKey="anomaly" 
                name={`Anomaly Magnitude (${unit})`} 
                fill="#f43f5e" 
                opacity={0.8}
              />
              <Line 
                type="monotone" 
                dataKey="observed" 
                name={`Observed (${unit})`} 
                stroke="#38bdf8" 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="historicalBaseline" 
                name={`Baseline Normal (${unit})`} 
                stroke="#94a3b8" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytical Narrative */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-rose-300 block mb-1">Climatological Departure Synthesis:</strong>
          {anomalyData.explanation}
        </div>
      </div>

      <DataProvenance provenance={anomalyData.provenance} />
    </div>
  );
};
