import React, { useState, useEffect } from 'react';
import { 
  fetchHistoricalData, 
  fetchTrendData, 
  fetchAnomalyData, 
  fetchComparisonData, 
  fetchExtremeEvents, 
  fetchClimateFingerprint, 
  fetchForecastAccuracy 
} from './services/analyticsApi.js';
import { 
  HistoricalAnalyticsResponse, 
  TrendAnalyticsResponse, 
  AnomalyAnalyticsResponse, 
  LocationComparisonResponse, 
  ExtremeEventsResponse, 
  ClimateFingerprintResponse, 
  ForecastAccuracyResponse, 
  WeatherMetric, 
  AggregationPeriod 
} from './types/analytics.js';

import { ResearchOverview } from './components/ResearchOverview.js';
import { HistoricalExplorer } from './components/HistoricalExplorer.js';
import { TrendAnalysis } from './components/TrendAnalysis.js';
import { AnomalyAnalysis } from './components/AnomalyAnalysis.js';
import { SpatialAnomalyMap } from './components/SpatialAnomalyMap.js';
import { LocationComparison } from './components/LocationComparison.js';
import { ExtremeEvents } from './components/ExtremeEvents.js';
import { EventReplay } from './components/EventReplay.js';
import { ClimateFingerprint } from './components/ClimateFingerprint.js';
import { ForecastAccuracy } from './components/ForecastAccuracy.js';

import { 
  CloudSun, 
  Layers, 
  TrendingUp, 
  Flame, 
  Globe, 
  Scale, 
  AlertTriangle, 
  RotateCcw, 
  Compass, 
  Target, 
  Search, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

import { LocationData } from './components/LocationSearch.js';

export const ResearchDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [location, setLocation] = useState<string | LocationData>('Pune');
  const [locationB, setLocationB] = useState<string | LocationData>('Mumbai');
  const [metric, setMetric] = useState<WeatherMetric>('rainfall');
  const [aggregation, setAggregation] = useState<AggregationPeriod>('monthly');
  const [startDate, setStartDate] = useState<string>('2015-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');

  // Analytical Data States
  const [historicalData, setHistoricalData] = useState<HistoricalAnalyticsResponse | null>(null);
  const [trendData, setTrendData] = useState<TrendAnalyticsResponse | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyAnalyticsResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<LocationComparisonResponse | null>(null);
  const [extremeData, setExtremeData] = useState<ExtremeEventsResponse | null>(null);
  const [climateData, setClimateData] = useState<ClimateFingerprintResponse | null>(null);
  const [forecastData, setForecastData] = useState<ForecastAccuracyResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const locName = typeof location === 'string' ? location : location.name;
  const locBName = typeof locationB === 'string' ? locationB : locationB.name;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      fetchHistoricalData(locName, startDate, endDate, metric, aggregation),
      fetchTrendData(locName, startDate, endDate, metric),
      fetchAnomalyData(locName, startDate, endDate, metric),
      fetchComparisonData(locName, locBName, startDate, endDate, metric),
      fetchExtremeEvents(locName, startDate, endDate),
      fetchClimateFingerprint(locName),
      fetchForecastAccuracy(locName, metric === 'temperature' ? 'temperature' : 'temperature', 14)
    ])
      .then(([hist, trend, anom, comp, ext, clim, fc]) => {
        if (mounted) {
          setHistoricalData(hist);
          setTrendData(trend);
          setAnomalyData(anom);
          setComparisonData(comp);
          setExtremeData(ext);
          setClimateData(clim);
          setForecastData(fc);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching analytics dataset:', err);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [location, locationB, metric, aggregation, startDate, endDate]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'explorer', label: 'Historical Explorer', icon: Activity },
    { id: 'trends', label: 'Climate Trends', icon: TrendingUp },
    { id: 'anomaly', label: 'Anomaly Engine', icon: Flame },
    { id: 'spatial', label: 'Spatial Anomaly Map', icon: Globe },
    { id: 'compare', label: 'Location Comparison', icon: Scale },
    { id: 'extremes', label: 'Extreme Events', icon: AlertTriangle },
    { id: 'replay', label: 'Event Replay', icon: RotateCcw },
    { id: 'fingerprint', label: 'Climate Fingerprint', icon: Compass },
    { id: 'forecast', label: 'Forecast Accuracy', icon: Target }
  ];

  return (
    <div className="h-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">

      {/* Main Container with Sidebar and Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex shrink-0 shadow-sm overflow-y-auto overflow-x-hidden">
          <div className="p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pb-2 pt-2">Analysis Modules</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {activeTab === 'overview' && (
          <ResearchOverview
            historicalData={historicalData}
            trendData={trendData}
            anomalyData={anomalyData}
            extremeData={extremeData}
            climateData={climateData}
            location={locName}
            metric={metric}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'explorer' && (
          <HistoricalExplorer
            data={historicalData}
            loading={loading}
            selectedLocation={locName}
            startDate={startDate}
            endDate={endDate}
            selectedMetric={metric}
            selectedAggregation={aggregation}
            onLocationChange={(loc) => setLocation(loc)}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            onMetricChange={setMetric}
            onAggregationChange={setAggregation}
          />
        )}

        {activeTab === 'trends' && (
          <TrendAnalysis
            trendData={trendData}
            loading={loading}
            selectedMetric={metric}
          />
        )}

        {activeTab === 'anomaly' && (
          <AnomalyAnalysis
            anomalyData={anomalyData}
            loading={loading}
            selectedMetric={metric}
          />
        )}

        {activeTab === 'spatial' && (
          <SpatialAnomalyMap />
        )}

        {activeTab === 'compare' && (
          <LocationComparison
            comparisonData={comparisonData}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
            selectedMetric={metric}
          />
        )}

        {activeTab === 'extremes' && (
          <ExtremeEvents
            extremeData={extremeData}
            loading={loading}
          />
        )}

        {activeTab === 'replay' && (
          <EventReplay />
        )}

        {activeTab === 'fingerprint' && (
          <ClimateFingerprint
            climateData={climateData}
            loading={loading}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastAccuracy
            accuracyData={forecastData}
            loading={loading}
          />
        )}
      </main>
      </div>

      {/* Scientific Footer */}
      <footer className="bg-white border-t border-slate-200 text-xs text-slate-500 py-4 mt-auto flex-shrink-0 z-10 relative">
        <div className="w-full px-4 flex flex-col xl:flex-row items-center justify-between gap-2">
          <div className="truncate font-medium text-slate-700">
            SIH Research & Analytics • Numerical Weather Intelligence Engine
          </div>
          <div className="flex items-center gap-4 text-[11px] truncate">
            <span>ERA5 Reanalysis (0.1°)</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">IMD Reference Normals</span>
            <span className="hidden lg:inline">•</span>
            <span className="hidden lg:inline">Strict Numerical Integrity</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResearchDashboard;
