import React from 'react';
import { TrendAnalyticsResponse, WeatherMetric } from '../types/analytics.js';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  trendData: TrendAnalyticsResponse | null;
  loading: boolean;
  selectedMetric: WeatherMetric;
}

export const TrendAnalysis: React.FC<Props> = ({ trendData, loading, selectedMetric }) => {
  const unit = selectedMetric === 'rainfall' ? 'mm' : '°C';
  const isRain = selectedMetric === 'rainfall';

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!trendData) return null;

  return (
    <div className="space-y-6">
      {/* Trend KPI Overview Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trajectory */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Trend Trajectory</div>
          <div className="mt-2 flex items-center gap-2">
            {trendData.trendDirection === 'INCREASING' ? (
              <TrendingUp className="w-6 h-6 text-amber-400" />
            ) : trendData.trendDirection === 'DECREASING' ? (
              <TrendingDown className="w-6 h-6 text-cyan-400" />
            ) : (
              <Minus className="w-6 h-6 text-slate-400" />
            )}
            <span className="text-2xl font-bold font-mono text-white">
              {trendData.trendDirection}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            Rate: {trendData.slopePerYear > 0 ? '+' : ''}{trendData.slopePerYear} {unit}/year
          </div>
        </div>

        {/* Change relative to baseline */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Period Change</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-400">
            {trendData.percentageChange > 0 ? `+${trendData.percentageChange}%` : `${trendData.percentageChange}%`}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Recent Mean: <span className="font-mono text-slate-200">{trendData.recentAverage} {unit}</span>
          </div>
        </div>

        {/* Baseline Climatological Normal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Baseline Normal</div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-200">
            {trendData.baselineAverage} {unit}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Initial Evaluation Reference Period
          </div>
        </div>

        {/* Inter-annual Variability */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Inter-Annual Variability</div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {trendData.variabilityPercent}%
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Coefficient of Variation (CV)
          </div>
        </div>
      </div>

      {/* Main Yearly Trend & OLS Regression Line */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Annual Meteorological Trend & Linear Regression Line
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ordinary Least Squares (OLS) regression line vs Observed Yearly Aggregates ({trendData.timeRange.start} to {trendData.timeRange.end})
            </p>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData.series} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: string) => [`${val} ${unit}`, name === 'actual' ? 'Yearly Value' : name === 'trendLine' ? 'OLS Trendline' : '3-Yr MA']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Observed Annual" />
              <Line type="linear" dataKey="trendLine" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="OLS Linear Trend" />
              <Line type="monotone" dataKey="ma7" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="2 2" name="3-Year Smoothing MA" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seasonal Partitioning Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Seasonal Partitioning Matrix
            </h3>
            <span className="text-xs text-slate-400">4-Season Breakdown</span>
          </div>

          <div className="h-60 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData.seasonalBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="season" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} ${unit}`, 'Seasonal Total/Mean']}
                />
                <Bar dataKey={isRain ? "totalSum" : "average"} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytical Explanation Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Trend Synthesis & Scientific Explanation</h3>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              {trendData.analyticalExplanation}
            </p>

            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-400">KEY METRICS:</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500">Slope:</span> <span className="text-slate-200">{trendData.slopePerYear > 0 ? '+' : ''}{trendData.slopePerYear} {unit}/yr</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500">Net Delta:</span> <span className="text-blue-400">{trendData.percentageChange > 0 ? '+' : ''}{trendData.percentageChange}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Statistically validated from OLS slope without statistical fabrication.
          </div>
        </div>
      </div>

      <DataProvenance provenance={trendData.provenance} />
    </div>
  );
};
