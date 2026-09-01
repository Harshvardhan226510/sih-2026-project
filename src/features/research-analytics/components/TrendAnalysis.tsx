import React, { useState } from 'react';
import { TrendAnalyticsResponse, WeatherMetric, ExplainTrendResponse } from '../types/analytics.js';
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
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Layers, 
  Sparkles, 
  CheckCircle2,
  Brain,
  ShieldCheck,
  Calendar,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';
import { explainTrendWithWeatherGPT } from '../services/analyticsApi.js';

interface Props {
  trendData: TrendAnalyticsResponse | null;
  loading: boolean;
  selectedMetric: WeatherMetric;
}

export const TrendAnalysis: React.FC<Props> = ({ trendData, loading, selectedMetric }) => {
  const [explaining, setExplaining] = useState(false);
  const [explanationResult, setExplanationResult] = useState<ExplainTrendResponse | null>(null);
  const [activeSeasonTab, setActiveSeasonTab] = useState<string>('ALL');

  const unit = selectedMetric === 'rainfall' ? 'mm' : '°C';
  const isRain = selectedMetric === 'rainfall';

  const handleExplainTrend = async () => {
    if (!trendData) return;
    setExplaining(true);
    try {
      const res = await explainTrendWithWeatherGPT(trendData);
      setExplanationResult(res);
    } catch (err) {
      console.error('Failed to explain trend:', err);
    } finally {
      setExplaining(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!trendData) return null;

  const significance = trendData.significance;

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
            Rate: <strong className="text-slate-200">{trendData.slopePerYear > 0 ? '+' : ''}{trendData.slopePerYear} {unit}/year</strong>
          </div>
        </div>

        {/* Statistical Significance Status (Feature 12) */}
        <div className={`rounded-xl p-4 shadow-sm border ${
          significance?.isSignificant 
            ? 'bg-blue-950/30 border-blue-500/40' 
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="text-xs font-semibold text-slate-400 uppercase flex items-center justify-between">
            <span>Statistical Significance</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              significance?.isSignificant 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {significance?.isSignificant ? 'p < 0.05' : 'p ≥ 0.05'}
            </span>
          </div>
          <div className="mt-2 text-base font-bold text-slate-100 font-sans">
            {significance?.label || 'Observed Trend'}
          </div>
          <div className="mt-1.5 text-xs text-slate-400 font-mono">
            Mann-Kendall Tau: <strong className="text-slate-300">{significance?.mannKendallTau ?? 'N/A'}</strong> (p = {significance?.pValue ?? '1.0'})
          </div>
        </div>

        {/* Change relative to baseline */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Period Shift</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-400">
            {trendData.percentageChange > 0 ? `+${trendData.percentageChange}%` : `${trendData.percentageChange}%`}
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            Recent Mean: <span className="text-slate-200">{trendData.recentAverage} {unit}</span>
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

      {/* Feature 12: Trend Significance Diagnostics & 95% Confidence Interval Card */}
      {significance && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Rigorous Statistical Significance Analysis (Mann-Kendall & OLS Regression)
              </h4>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              N = {significance.sampleSize} years • df = {significance.degreesOfFreedom}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-xs font-mono">
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">95% Confidence Interval for Slope</span>
              <strong className="text-white text-sm mt-0.5 block">
                [{significance.confidenceInterval95[0]} → {significance.confidenceInterval95[1]}] {unit}/yr
              </strong>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Regression Fit & Standard Error</span>
              <strong className="text-slate-200 text-sm mt-0.5 block">
                R² = {significance.rSquared} • SE = {significance.stdError}
              </strong>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Test Interpretation</span>
              <span className="text-slate-300 text-[11px] font-sans mt-0.5 block">
                {significance.interpretation}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Yearly Trend Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Annual Meteorological Time-Series & OLS Linear Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical actual values with fitted regression line and 3-year moving average
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Slope: <strong className="text-slate-200">{trendData.slopePerYear} {unit}/year</strong>
          </span>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit={unit} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '0.5rem' }}
              />
              <Legend />
              <Bar 
                dataKey="actual" 
                name={`Annual ${isRain ? 'Total' : 'Mean'} (${unit})`} 
                fill="#38bdf8" 
                opacity={0.6}
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="trendLine" 
                name="Fitted OLS Trend Line" 
                stroke="#fb7185" 
                strokeWidth={2.5} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="ma3" 
                name="3-Year Moving Average" 
                stroke="#fbbf24" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature 6: Seasonal Analysis with Indian Meteorological Terminology */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Seasonal Climatological Breakdown (Indian Seasons)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Winter (Dec–Feb), Pre-Monsoon / Summer (Mar–May), Monsoon (Jun–Sep), Post-Monsoon (Oct–Nov)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendData.seasonalBreakdown.map((season) => (
            <div key={season.season} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-300 uppercase">{season.season}</div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {isRain ? `${season.totalSum} ${unit}` : `${season.average} ${unit}`}
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-400 font-mono">
                <div>Mean: <strong className="text-slate-200">{season.average} {unit}</strong></div>
                <div>Variability (CV): <strong className="text-emerald-400">{season.variabilityCv}%</strong></div>
                {season.percentOfAnnual && (
                  <div>Annual Share: <strong className="text-blue-400">{season.percentOfAnnual}%</strong></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature 8: "Explain this trend with WeatherGPT" Action Card */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/50 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Explain This Trend with WeatherGPT
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Generates a verified, grounded meteorological explanation using only the deterministic calculation payload above. WeatherGPT is constrained from calculating or altering any statistics.
            </p>
          </div>

          <button
            onClick={handleExplainTrend}
            disabled={explaining}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
          >
            {explaining ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Explain This Trend
              </>
            )}
          </button>
        </div>

        {explanationResult && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/80 rounded-lg p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-3">
            <div className="flex items-center justify-between text-[11px] text-blue-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                WeatherGPT Grounded Climatological Synthesis
              </span>
              <span className="font-mono text-slate-500">{new Date(explanationResult.generatedAt).toLocaleTimeString()}</span>
            </div>

            <div className="prose prose-invert prose-xs max-w-none text-slate-300">
              {explanationResult.explanation.split('\n\n').map((para, i) => (
                <p key={i} className="mb-2 last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <DataProvenance provenance={trendData.provenance} />
    </div>
  );
};
