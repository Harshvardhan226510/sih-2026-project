import React from 'react';
import { 
  HistoricalAnalyticsResponse, 
  TrendAnalyticsResponse, 
  AnomalyAnalyticsResponse, 
  ExtremeEventsResponse, 
  ClimateFingerprintResponse 
} from '../types/analytics.js';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CloudRain, 
  Thermometer, 
  Activity, 
  Compass, 
  Sparkles, 
  CheckCircle, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { DataProvenance } from './DataProvenance.js';
import { KeyInsightsSummary } from './KeyInsightsSummary.js';

interface Props {
  historicalData: HistoricalAnalyticsResponse | null;
  trendData: TrendAnalyticsResponse | null;
  anomalyData: AnomalyAnalyticsResponse | null;
  extremeData: ExtremeEventsResponse | null;
  climateData: ClimateFingerprintResponse | null;
  location: string;
  metric: string;
  onNavigateTab: (tabId: string) => void;
}

export const ResearchOverview: React.FC<Props> = ({
  historicalData,
  trendData,
  anomalyData,
  extremeData,
  climateData,
  location,
  metric,
  onNavigateTab
}) => {
  const isRain = metric === 'rainfall';
  const unit = isRain ? 'mm' : '°C';

  const meanVal = historicalData?.summary.mean ?? 0;
  const maxVal = historicalData?.summary.max ?? 0;
  const anomalyPct = anomalyData?.anomalyPercentage ?? 0;
  const extremeCount = extremeData?.totalEvents ?? 0;

  // Feature 7: Deterministic Research Insights Generation
  const keyInsightsList = [];

  if (trendData) {
    keyInsightsList.push({
      id: 'insight-trend',
      type: 'trend' as const,
      title: `${trendData.trendDirection} Climate Trajectory`,
      description: `${trendData.slopePerYear > 0 ? '+' : ''}${trendData.slopePerYear} ${unit}/year slope with ${trendData.percentageChange > 0 ? '+' : ''}${trendData.percentageChange}% period change.`,
      metricValue: `${trendData.significance?.label || 'Observed'} (p = ${trendData.significance?.pValue ?? '1.0'})`,
      isSignificant: trendData.significance?.isSignificant
    });
  }

  if (anomalyData) {
    keyInsightsList.push({
      id: 'insight-anomaly',
      type: 'anomaly' as const,
      title: `Anomaly: ${anomalyData.badgeLabel}`,
      description: `Observed ${anomalyData.observedValue} ${unit} vs baseline ${anomalyData.historicalBaseline} ${unit} (Z=${anomalyData.zScore}σ).`,
      metricValue: `${anomalyData.detectedAnomaliesCount} significant day-level anomalies`,
      isSignificant: Math.abs(anomalyData.zScore) >= 2.0
    });
  }

  if (extremeData) {
    keyInsightsList.push({
      id: 'insight-extreme',
      type: 'extreme' as const,
      title: `${extremeData.totalEvents} Extreme Incidents`,
      description: `Detected across ${extremeData.timeRange.start} → ${extremeData.timeRange.end}. Heavy rain: ${extremeData.breakdownByType['HEAVY_RAINFALL'] || 0}, Heat: ${extremeData.breakdownByType['EXTREME_HEAT'] || 0}.`,
      metricValue: extremeData.recurrenceAnalysis?.averageIntervalDays 
        ? `Avg interval: ${extremeData.recurrenceAnalysis.averageIntervalDays} days`
        : undefined
    });
  }

  if (historicalData?.summary) {
    keyInsightsList.push({
      id: 'insight-dist',
      type: 'distribution' as const,
      title: `Distribution (P10–P90)`,
      description: `Median: ${historicalData.summary.median} ${unit}, IQR: ${historicalData.summary.iqr} ${unit}, 95th Percentile: ${historicalData.summary.p95} ${unit}.`,
      metricValue: `CV: ${historicalData.summary.variabilityCv || 0}%`
    });
  }

  return (
    <div className="space-y-6">
      {/* Feature 7: Key Insights Banner */}
      <KeyInsightsSummary insights={keyInsightsList} />

      {/* Top KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Mean Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Mean {metric}
            </span>
            {isRain ? (
              <CloudRain className="w-5 h-5 text-blue-400" />
            ) : (
              <Thermometer className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">
              {meanVal}
            </span>
            <span className="text-sm font-medium text-slate-400">{unit}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-mono">
            <span>Historical median:</span>
            <span className="text-slate-300 font-semibold">{historicalData?.summary.median ?? 0} {unit}</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* KPI 2: Max Recorded */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Peak / Maximum
            </span>
            <Activity className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">
              {maxVal}
            </span>
            <span className="text-sm font-medium text-slate-400">{unit}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-mono">
            <span>95th Percentile:</span>
            <span className="text-slate-300 font-semibold">{historicalData?.summary.p95 ?? 0} {unit}</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* KPI 3: Weather Anomaly Badge */}
        <div 
          onClick={() => onNavigateTab('anomaly')}
          className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer rounded-xl p-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Climatological Anomaly
            </span>
            {anomalyPct >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold tracking-tight font-mono ${
              anomalyPct > 20 ? 'text-amber-400' : anomalyPct < -20 ? 'text-cyan-400' : 'text-emerald-400'
            }`}>
              {anomalyPct > 0 ? `+${anomalyPct}%` : `${anomalyPct}%`}
            </span>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {anomalyData?.badgeLabel || 'NORMAL'}
            </span>
          </div>
        </div>

        {/* KPI 4: Extreme Events */}
        <div 
          onClick={() => onNavigateTab('extremes')}
          className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer rounded-xl p-4 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Extreme Events
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">
              {extremeCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">recorded</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-mono">
            <span>Severe / Extreme:</span>
            <span className="font-semibold text-amber-300">
              {(extremeData?.breakdownBySeverity['EXTREME'] || 0) + (extremeData?.breakdownBySeverity['VERY_SEVERE'] || 0)} events
            </span>
          </div>
        </div>
      </div>

      {/* Main Historical Trendline Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Long-Term {metric.toUpperCase()} Trajectory & Historical Mean
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Time-series observations with ordinary least squares trendline for {location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${
              trendData?.trendDirection === 'INCREASING'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : trendData?.trendDirection === 'DECREASING'
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              Trend: {trendData?.trendDirection || 'STABLE'} ({(trendData?.slopePerYear ?? 0) > 0 ? '+' : ''}{trendData?.slopePerYear ?? 0} {unit}/yr)
            </span>
            <button
              onClick={() => onNavigateTab('trends')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Detailed Trends →
            </button>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData?.series || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`${val} ${unit}`, name === 'actual' ? 'Observed' : 'Trend Slope']}
              />
              <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#trendGradient)" name="actual" />
              <Area type="monotone" dataKey="trendLine" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fill="none" name="trendLine" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row: Seasonal Breakdown & Climate Fingerprint Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seasonal Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Seasonal {metric} Distribution
            </h3>
            <span className="text-xs text-slate-400 font-mono">Indian Meteorological Normal</span>
          </div>

          <div className="h-56 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData?.seasonalBreakdown || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="season" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} ${unit}`, 'Seasonal Sum/Mean']}
                />
                <Bar dataKey={isRain ? "totalSum" : "average"} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Climate Fingerprint Preview */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                Climate Profile: {location}
              </h3>
              <button 
                onClick={() => onNavigateTab('fingerprint')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                View Full Fingerprint →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium">Climate Classification</div>
                <div className="font-semibold text-slate-200 mt-1">{climateData?.climateZone || 'Tropical Savanna (Aw)'}</div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium">Dominant Pattern</div>
                <div className="font-semibold text-slate-200 mt-1">{climateData?.dominantWeatherPattern || 'Southwest Monsoon Driven'}</div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium">Monsoon Share</div>
                <div className="font-semibold text-emerald-400 font-mono text-base mt-0.5">
                  {climateData?.rainfallSeasonality.monsoonPct || 82}% of Annual Rain
                </div>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium">Annual Diurnal Range</div>
                <div className="font-semibold text-amber-400 font-mono text-base mt-0.5">
                  {climateData?.temperatureVariability.diurnalRangeMean || 9.4} °C
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights derived from backend */}
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Verified Analytical Syntheses
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{trendData?.analyticalExplanation || `${metric} has shown regular seasonal variations.`}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{anomalyData?.explanation || 'Observation is consistent with standard historical baselines.'}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reusable Data Provenance Footer */}
      <DataProvenance provenance={historicalData?.provenance} />
    </div>
  );
};
