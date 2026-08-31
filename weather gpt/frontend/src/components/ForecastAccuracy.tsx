import React from 'react';
import { ForecastAccuracyResponse } from '../types/analytics.js';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Target, Activity, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  accuracyData: ForecastAccuracyResponse | null;
  loading: boolean;
}

export const ForecastAccuracy: React.FC<Props> = ({ accuracyData, loading }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!accuracyData) return null;

  const unit = accuracyData.parameter === 'temperature' ? '°C' : 'mm';

  return (
    <div className="space-y-6">
      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Mean Absolute Error (MAE)</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-400">
            {accuracyData.metrics.mae} {unit}
          </div>
          <div className="mt-1 text-xs text-slate-400">Average forecast absolute deviation</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Root Mean Square Error</div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-400">
            {accuracyData.metrics.rmse} {unit}
          </div>
          <div className="mt-1 text-xs text-slate-400">Penalizes large outlier forecast errors</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Forecast Bias</div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {accuracyData.metrics.bias > 0 ? `+${accuracyData.metrics.bias}` : accuracyData.metrics.bias} {unit}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {accuracyData.metrics.bias > 0 ? 'Over-forecasting' : 'Under-forecasting'} tendency
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Hit Rate (±2°C / 5mm)</div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {accuracyData.metrics.forecastHitRatePct}%
          </div>
          <div className="mt-1 text-xs text-slate-400">Operational accuracy within tolerance</div>
        </div>
      </div>

      {/* Forecast vs Observed Paired Verification Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              NWP Forecast vs Ground-Truth Synoptic Observations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              14-Day paired verification trajectory for {accuracyData.location}
            </p>
          </div>
        </div>

        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={accuracyData.comparisonSeries} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: string) => [`${val} ${unit}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Actual Observed" />
              <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} name="ECMWF/GFS Forecast" />
              <Bar dataKey="error" fill="#ef4444" opacity={0.6} name="Residual Error" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Interpretation Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Forecast Verification Interpretation</h3>
        </div>
        <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
          {accuracyData.interpretation}
        </p>
      </div>

      <DataProvenance provenance={accuracyData.provenance} />
    </div>
  );
};
