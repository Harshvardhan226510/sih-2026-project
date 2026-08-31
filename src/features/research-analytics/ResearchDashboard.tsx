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
import { ResearchQuery } from './components/ResearchQuery.js';

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

export const ResearchDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [location, setLocation] = useState<string>('Pune');
  const [locationB, setLocationB] = useState<string>('Mumbai');
  const [metric, setMetric] = useState<WeatherMetric>('rainfall');
  const [aggregation, setAggregation] = useState<AggregationPeriod>('monthly');
  const [startDate, setStartDate] = useState<string>('2015-01-01');
  const [endDate, setEndDate] = useState<string>('2024-12-31');

  // Analytical Data States
  const [historicalData, setHistoricalData] = useState<HistoricalAnalyticsResponse | null>(null);
  const [trendData, setTrendData] = useState<TrendAnalyticsResponse | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyAnalyticsResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<LocationComparisonResponse | null>(null);
  const [extremeData, setExtremeData] = useState<ExtremeEventsResponse | null>(null);
  const [climateData, setClimateData] = useState<ClimateFingerprintResponse | null>(null);
  const [forecastData, setForecastData] = useState<ForecastAccuracyResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      fetchHistoricalData(location, startDate, endDate, metric, aggregation),
      fetchTrendData(location, startDate, endDate, metric),
      fetchAnomalyData(location, startDate, endDate, metric),
      fetchComparisonData(location, locationB, startDate, endDate, metric),
      fetchExtremeEvents(location, startDate, endDate),
      fetchClimateFingerprint(location),
      fetchForecastAccuracy(location, metric === 'temperature' ? 'temperature' : 'temperature', 14)
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
    { id: 'forecast', label: 'Forecast Accuracy', icon: Target },
    { id: 'query', label: 'Research Query', icon: Search }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Government/Scientific Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">WeatherGPT</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Research & Analytics Module
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Smart India Hackathon • Meteorological Evidence, Climate Analytics & Anomaly Detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data Engine: <strong className="text-slate-200">ERA5 / IMD Grid</strong></span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API Connected
            </span>
          </div>
        </div>

        {/* Horizontal Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto border-t border-slate-800/80 scrollbar-none">
          <nav className="flex space-x-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <ResearchOverview
            historicalData={historicalData}
            trendData={trendData}
            anomalyData={anomalyData}
            extremeData={extremeData}
            climateData={climateData}
            location={location}
            metric={metric}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'explorer' && (
          <HistoricalExplorer
            data={historicalData}
            loading={loading}
            selectedLocation={location}
            startDate={startDate}
            endDate={endDate}
            selectedMetric={metric}
            selectedAggregation={aggregation}
            onLocationChange={setLocation}
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
            locationA={location}
            locationB={locationB}
            selectedMetric={metric}
            onLocationAChange={setLocation}
            onLocationBChange={setLocationB}
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

        {activeTab === 'query' && (
          <ResearchQuery />
        )}
      </main>

      {/* Scientific Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-400 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            WeatherGPT SIH Research & Analytics • Numerical Weather Intelligence Engine
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>ERA5 Reanalysis (0.1°)</span>
            <span>•</span>
            <span>IMD Reference Normals</span>
            <span>•</span>
            <span>Strict Numerical Integrity</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ResearchDashboard;
