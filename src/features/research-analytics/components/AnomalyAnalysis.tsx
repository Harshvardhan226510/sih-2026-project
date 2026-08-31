import React from 'react';
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
  Activity 
} from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  anomalyData: AnomalyAnalyticsResponse | null;
  loading: boolean;
  selectedMetric: WeatherMetric;
}

export const AnomalyAnalysis: React.FC<Props> = ({ anomalyData, loading, selectedMetric }) => {
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
  const isPositive = anomalyData.anomaly >= 0;

  return (
    <div className="space-y-6">
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
              Evaluation Window: {anomalyData.targetPeriod.start} → {anomalyData.targetPeriod.end} (vs Baseline: {anomalyData.baselinePeriod.start} → {anomalyData.baselinePeriod.end})
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
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                Classification
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
            <div className="text-[11px] text-slate-500 mt-1">Long-term reference expected value</div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase">Target Period Observed</div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {anomalyData.observedValue} {unit}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Actual measured sensor/reanalysis value</div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase">Statistical Departure (Z-Score)</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${isPositive ? 'text-amber-400' : 'text-cyan-400'}`}>
              {isPositive ? `+${anomalyData.anomaly}` : anomalyData.anomaly} {unit} ({anomalyData.zScore}σ)
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {anomalyData.anomalyPercentage > 0 ? `+${anomalyData.anomalyPercentage}%` : `${anomalyData.anomalyPercentage}%`} relative deviation
            </div>
          </div>
        </div>
      </div>

      {/* "Why is this unusual?" Analytical Explanation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">"Why is this unusual?" Analytical Explanation</h3>
        </div>
        <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
          {anomalyData.explanation}
        </p>
      </div>

      {/* Daily Observed vs Climatological Normal Comparison Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Daily Observed vs Climatological Normal Baseline
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Day-by-day observation compared to 10-year historical daily normal
            </p>
          </div>
        </div>

        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={anomalyData.timeSeries} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: string) => [`${val} ${unit}`, name === 'observed' ? 'Observed' : name === 'historicalBaseline' ? 'Baseline Normal' : 'Anomaly']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="observed" fill="#3b82f6" name="Observed" radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="historicalBaseline" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="3 3" name="Baseline Normal" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DataProvenance provenance={anomalyData.provenance} />
    </div>
  );
};
