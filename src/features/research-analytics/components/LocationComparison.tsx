import React, { useState } from 'react';
import { LocationComparisonResponse, PeriodComparisonResponse, WeatherMetric } from '../types/analytics.js';
import { 
  ResponsiveContainer, 
  LineChart, 
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
  Scale, 
  Plus, 
  X, 
  Calendar, 
  ArrowRight, 
  Activity, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  Sliders,
  Layers
} from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';
import { LocationSearch, LocationData } from './LocationSearch.js';
import { fetchMultiLocationComparison, fetchPeriodComparison } from '../services/analyticsApi.js';

interface Props {
  comparisonData: LocationComparisonResponse | null;
  loading: boolean;
  selectedMetric: WeatherMetric;
  startDate: string;
  endDate: string;
}

const LOCATION_COLORS = ['#38bdf8', '#fb7185', '#34d399', '#fbbf24'];

export const LocationComparison: React.FC<Props> = ({
  comparisonData: initialData,
  loading: initialLoading,
  selectedMetric,
  startDate,
  endDate
}) => {
  const [mode, setMode] = useState<'locations' | 'periods'>('locations');

  // Multi-location state (2 to 4 locations)
  const [locations, setLocations] = useState<LocationData[]>([
    { name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567 },
    { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777 }
  ]);

  const [multiData, setMultiData] = useState<LocationComparisonResponse | null>(initialData);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Period comparison state
  const [periodLocation, setPeriodLocation] = useState<LocationData>({
    name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567
  });
  const [periodAStart, setPeriodAStart] = useState('1990-01-01');
  const [periodAEnd, setPeriodAEnd] = useState('2000-12-31');
  const [periodBStart, setPeriodBStart] = useState('2015-01-01');
  const [periodBEnd, setPeriodBEnd] = useState('2024-12-31');
  const [periodData, setPeriodData] = useState<PeriodComparisonResponse | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  const unit = selectedMetric === 'rainfall' ? 'mm' : '°C';
  const isRain = selectedMetric === 'rainfall';

  // Fetch multi-location data
  const handleCompareLocations = async (locsToUse: LocationData[]) => {
    if (locsToUse.length < 2) return;
    setLoadingLocations(true);
    try {
      const data = await fetchMultiLocationComparison(locsToUse, startDate, endDate, selectedMetric);
      setMultiData(data);
    } catch (err) {
      console.error('Multi-location comparison failed:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Add location
  const handleAddLocation = (newLoc: LocationData) => {
    if (locations.length >= 4) return;
    const updated = [...locations, newLoc];
    setLocations(updated);
    handleCompareLocations(updated);
  };

  // Remove location
  const handleRemoveLocation = (index: number) => {
    if (locations.length <= 2) return;
    const updated = locations.filter((_, i) => i !== index);
    setLocations(updated);
    handleCompareLocations(updated);
  };

  // Update specific location
  const handleLocationChange = (index: number, newLoc: LocationData) => {
    const updated = [...locations];
    updated[index] = newLoc;
    setLocations(updated);
    handleCompareLocations(updated);
  };

  // Trigger period comparison
  const handleComparePeriods = async () => {
    setLoadingPeriods(true);
    try {
      const data = await fetchPeriodComparison(
        periodLocation,
        { start: periodAStart, end: periodAEnd },
        { start: periodBStart, end: periodBEnd },
        selectedMetric
      );
      setPeriodData(data);
    } catch (err) {
      console.error('Period comparison failed:', err);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const activeLocationsData = multiData || initialData;

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('locations')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              mode === 'locations'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            Location Comparison (2–4 Stations)
          </button>
          <button
            onClick={() => {
              setMode('periods');
              if (!periodData) handleComparePeriods();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              mode === 'periods'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Period-vs-Period Comparison (Diachronic)
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:block pr-3 font-mono">
          Metric: <strong className="text-slate-200 uppercase">{selectedMetric}</strong> ({unit})
        </span>
      </div>

      {mode === 'locations' ? (
        <>
          {/* Dynamic 2-4 Location Pickers */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Comparative Stations (Dynamic India-Only Geocoding)
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {locations.length} of 4 Locations Selected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {locations.map((loc, idx) => (
                <div key={idx} className="relative bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: `${LOCATION_COLORS[idx]}20`, 
                        color: LOCATION_COLORS[idx] 
                      }}
                    >
                      Station {idx + 1}
                    </span>
                    {locations.length > 2 && (
                      <button
                        onClick={() => handleRemoveLocation(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove location"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <LocationSearch
                    selectedLocation={loc}
                    onLocationChange={(newLoc) => handleLocationChange(idx, newLoc)}
                  />
                  <div className="mt-1 text-[10px] text-slate-500 font-mono truncate">
                    {loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E
                  </div>
                </div>
              ))}

              {locations.length < 4 && (
                <div className="flex items-center justify-center p-4 border border-dashed border-slate-800 hover:border-slate-700 rounded-lg">
                  <div className="w-full">
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      + Add Comparative Station
                    </label>
                    <LocationSearch
                      selectedLocation=""
                      onLocationChange={(newLoc) => handleAddLocation(newLoc)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {loadingLocations || initialLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : activeLocationsData ? (
            <>
              {/* Comparative Ranking & Metrics Matrix */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Station Ranking & Comparative Statistical Matrix
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="pb-2.5">Rank</th>
                        <th className="pb-2.5">Station</th>
                        <th className="pb-2.5">{isRain ? 'Total Accumulated' : 'Mean Temperature'}</th>
                        <th className="pb-2.5">Min</th>
                        <th className="pb-2.5">Max</th>
                        <th className="pb-2.5">Median</th>
                        <th className="pb-2.5">90th Percentile</th>
                        <th className="pb-2.5">Variability (CV)</th>
                        <th className="pb-2.5">Extreme Incidents</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {(activeLocationsData.locations || []).map((loc, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              idx === 0 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              idx === 1 ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                              'bg-slate-900 text-slate-400'
                            }`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-2.5 font-sans font-bold text-slate-200 flex items-center gap-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ backgroundColor: LOCATION_COLORS[idx % LOCATION_COLORS.length] }} 
                            />
                            {loc.name}, {loc.state}
                          </td>
                          <td className="py-2.5 font-bold text-blue-400">
                            {loc.primaryMetricValue} {unit}
                          </td>
                          <td className="py-2.5 text-slate-300">{loc.stats.min} {unit}</td>
                          <td className="py-2.5 text-slate-300">{loc.stats.max} {unit}</td>
                          <td className="py-2.5 text-slate-400">{loc.stats.median} {unit}</td>
                          <td className="py-2.5 text-slate-400">{loc.stats.p90} {unit}</td>
                          <td className="py-2.5 text-emerald-400">{loc.variabilityCv}%</td>
                          <td className="py-2.5 text-rose-400">{loc.extremeEventsCount} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Multi-Station Comparative Time Series Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Synchronized Comparative Meteorological Timeline
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {startDate} → {endDate}
                  </span>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeLocationsData.timeSeries}>
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
                      {(activeLocationsData.locations || []).map((loc, idx) => (
                        <Line
                          key={loc.name}
                          type="monotone"
                          dataKey={loc.name}
                          name={`${loc.name} (${unit})`}
                          stroke={LOCATION_COLORS[idx % LOCATION_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Analytical Explanation */}
              <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-300 block mb-1">Comparative Evidence Summary:</strong>
                  {activeLocationsData.analyticalExplanation}
                </div>
              </div>

              <DataProvenance provenance={activeLocationsData.provenance} />
            </>
          ) : null}
        </>
      ) : (
        /* Period-vs-Period Comparison View */
        <div className="space-y-6">
          {/* Period Selector Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1.5">
                  Target Station
                </label>
                <LocationSearch
                  selectedLocation={periodLocation}
                  onLocationChange={(l) => setPeriodLocation(l)}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1.5">
                  Period A (Baseline Historical)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={periodAStart}
                    onChange={(e) => setPeriodAStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 font-mono"
                  />
                  <span className="text-slate-500">→</span>
                  <input
                    type="date"
                    value={periodAEnd}
                    onChange={(e) => setPeriodAEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1.5">
                  Period B (Evaluation Period)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={periodBStart}
                    onChange={(e) => setPeriodBStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 font-mono"
                  />
                  <span className="text-slate-500">→</span>
                  <input
                    type="date"
                    value={periodBEnd}
                    onChange={(e) => setPeriodBEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleComparePeriods}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Compute Period Differential Analysis
              </button>
            </div>
          </div>

          {loadingPeriods ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : periodData ? (
            <>
              {/* Period KPI Cards: Period A vs Period B vs Delta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Period A */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PERIOD A (EARLIER)</span>
                  <h4 className="text-base font-bold text-slate-200 mt-1">{periodData.periodA.timeRange.start} → {periodData.periodA.timeRange.end}</h4>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
                      <span className="text-slate-400">Mean:</span>
                      <strong className="text-slate-200">{periodData.periodA.stats.mean} {unit}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
                      <span className="text-slate-400">Variability (CV):</span>
                      <strong className="text-emerald-400">{periodData.periodA.stats.variabilityCv}%</strong>
                    </div>
                    <div className="flex justify-between py-1 font-mono">
                      <span className="text-slate-400">Extreme Events:</span>
                      <strong className="text-rose-400">{periodData.periodA.extremeEventsCount} days</strong>
                    </div>
                  </div>
                </div>

                {/* Period B */}
                <div className="bg-slate-900/90 border border-blue-500/40 rounded-xl p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">PERIOD B (RECENT)</span>
                  <h4 className="text-base font-bold text-white mt-1">{periodData.periodB.timeRange.start} → {periodData.periodB.timeRange.end}</h4>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
                      <span className="text-slate-400">Mean:</span>
                      <strong className="text-blue-400">{periodData.periodB.stats.mean} {unit}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800 font-mono">
                      <span className="text-slate-400">Variability (CV):</span>
                      <strong className="text-emerald-400">{periodData.periodB.stats.variabilityCv}%</strong>
                    </div>
                    <div className="flex justify-between py-1 font-mono">
                      <span className="text-slate-400">Extreme Events:</span>
                      <strong className="text-rose-400">{periodData.periodB.extremeEventsCount} days</strong>
                    </div>
                  </div>
                </div>

                {/* Net Difference */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">NET DIACHRONIC SHIFT</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-2xl font-black font-mono ${
                      periodData.differences.absoluteChange > 0 ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      {periodData.differences.absoluteChange > 0 ? `+${periodData.differences.absoluteChange}` : periodData.differences.absoluteChange} {unit}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-300">
                      ({periodData.differences.percentChange > 0 ? `+${periodData.differences.percentChange}` : periodData.differences.percentChange}%)
                    </span>
                  </div>
                  <div className="mt-3 text-xs space-y-1 text-slate-400 font-mono">
                    <div>Variability Shift: <strong className="text-slate-200">{periodData.differences.variabilityChange > 0 ? `+${periodData.differences.variabilityChange}` : periodData.differences.variabilityChange}%</strong></div>
                    <div>Extreme Frequency Shift: <strong className="text-slate-200">{periodData.differences.extremeEventsChange > 0 ? `+${periodData.differences.extremeEventsChange}` : periodData.differences.extremeEventsChange} days</strong></div>
                  </div>
                </div>
              </div>

              {/* Analytical Summary */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-1">Period Difference Evidence:</strong>
                  {periodData.analyticalExplanation}
                </div>
              </div>

              <DataProvenance provenance={periodData.provenance} />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
