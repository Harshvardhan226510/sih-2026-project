import React, { useState } from 'react';
import { 
  HistoricalAnalyticsResponse, 
  WeatherMetric, 
  AggregationPeriod 
} from '../types/analytics.js';
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
  Calendar, 
  Download, 
  Sliders, 
  BarChart2, 
  TrendingUp, 
  Table, 
  Check, 
  Info,
  PieChart,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';
import { LocationSearch, LocationData } from './LocationSearch.js';

interface Props {
  data: HistoricalAnalyticsResponse | null;
  loading: boolean;
  selectedLocation: string | LocationData;
  startDate: string;
  endDate: string;
  selectedMetric: WeatherMetric;
  selectedAggregation: AggregationPeriod;
  onLocationChange: (loc: LocationData | string) => void;
  onDateChange: (start: string, end: string) => void;
  onMetricChange: (m: WeatherMetric) => void;
  onAggregationChange: (agg: AggregationPeriod) => void;
}

export const HistoricalExplorer: React.FC<Props> = ({
  data,
  loading,
  selectedLocation,
  startDate,
  endDate,
  selectedMetric,
  selectedAggregation,
  onLocationChange,
  onDateChange,
  onMetricChange,
  onAggregationChange
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [showMA7, setShowMA7] = useState(true);
  const [showMA30, setShowMA30] = useState(false);
  const [showMA90, setShowMA90] = useState(false);
  const [lookupValue, setLookupValue] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  const unit = data?.summary.unit || 'mm';
  const isRain = selectedMetric === 'rainfall';

  // Feature 5: Comprehensive CSV Export Handler
  const handleExportCSV = () => {
    if (!data || !data.dataPoints || data.dataPoints.length === 0) return;

    const locName = typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name;
    const headers = [
      'Date',
      `Observation_${selectedMetric}_(${unit})`,
      `Min_(${unit})`,
      `Max_(${unit})`,
      'RollingAvg7d',
      'RollingAvg30d',
      'PercentileRank',
      'Classification'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = data.dataPoints.map(p => [
      escapeCsv(p.date),
      escapeCsv(p.value),
      escapeCsv(p.min ?? ''),
      escapeCsv(p.max ?? ''),
      escapeCsv(p.rollingAvg7d ?? ''),
      escapeCsv(p.rollingAvg30d ?? ''),
      escapeCsv(p.percentileRank ? `${p.percentileRank}%` : ''),
      escapeCsv(p.classification ?? '')
    ]);

    const csvContent = [
      `# WeatherGPT Research Analytics Dataset Export`,
      `# Location: ${locName}`,
      `# Parameter: ${selectedMetric} (${unit})`,
      `# Resolution: ${selectedAggregation}`,
      `# Period: ${startDate} to ${endDate}`,
      `# Export Timestamp: ${new Date().toISOString()}`,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WeatherGPT_${locName}_${selectedMetric}_${selectedAggregation}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Feature 9: Percentile Rank Lookup
  const handlePercentileLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !data.dataPoints || data.dataPoints.length === 0 || !lookupValue) return;

    const val = parseFloat(lookupValue);
    if (isNaN(val)) return;

    const values = data.dataPoints.map(p => p.value).sort((a, b) => a - b);
    let countBelow = 0;
    for (const v of values) {
        if (v < val) countBelow++;
    }
    const rank = Number(((countBelow / values.length) * 100).toFixed(1));

    const dist = data.summary;
    let label = 'Typical';
    if (val >= dist.p90) label = 'Extreme High (Top 10% of historical distribution)';
    else if (val >= dist.p75) label = 'Unusually High (Top 25% quartile)';
    else if (val <= dist.p10) label = 'Extreme Low (Bottom 10% of historical distribution)';
    else if (val <= dist.p25) label = 'Unusually Low (Bottom 25% quartile)';

    setLookupResult(`Value of ${val} ${unit} corresponds to the ${rank}th percentile (${label}).`);
  };

  return (
    <div className="space-y-6">
      {/* Control / Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Location Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Target Location
            </label>
            <LocationSearch 
              selectedLocation={selectedLocation} 
              onLocationChange={onLocationChange} 
            />
          </div>

          {/* Meteorological Parameter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Meteorological Variable
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => onMetricChange(e.target.value as WeatherMetric)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="rainfall">Rainfall / Precipitation (mm)</option>
              <option value="temperature">Mean Temperature (°C)</option>
              <option value="temp_max">Maximum Temperature (°C)</option>
              <option value="temp_min">Minimum Temperature (°C)</option>
              <option value="humidity">Relative Humidity (%)</option>
              <option value="wind_speed">Wind Speed (km/h)</option>
              <option value="pressure">Surface Pressure (hPa)</option>
              <option value="cloud_cover">Cloud Cover (%)</option>
            </select>
          </div>

          {/* Aggregation */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Temporal Aggregation
            </label>
            <select
              value={selectedAggregation}
              onChange={(e) => onAggregationChange(e.target.value as AggregationPeriod)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="daily">Daily Resolution</option>
              <option value="weekly">Weekly Aggregation</option>
              <option value="monthly">Monthly Aggregation</option>
              <option value="yearly">Yearly Aggregation</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onDateChange(e.target.value, endDate)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-slate-500">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onDateChange(startDate, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                chartType === 'line' 
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Line View
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                chartType === 'bar' 
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Bar View
            </button>

            <span className="h-4 w-px bg-slate-800 mx-1" />

            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showMA7} 
                onChange={(e) => setShowMA7(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-blue-600"
              />
              7-Day MA
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showMA30} 
                onChange={(e) => setShowMA30(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-blue-600"
              />
              30-Day MA
            </label>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export Selected Dataset as CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : data ? (
        <>
          {/* Feature 9: Percentile & Statistical Distribution Analysis */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-400" />
                Percentile & Distribution Analysis (P10 → P90)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {data.dataPoints.length} Aggregated Observations
              </span>
            </div>

            {/* Distribution KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Min</div>
                <div className="text-base font-bold font-mono text-slate-200 mt-1">{data.summary.min} {unit}</div>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">P10</div>
                <div className="text-base font-bold font-mono text-slate-300 mt-1">{data.summary.p10} {unit}</div>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">P25 (Q1)</div>
                <div className="text-base font-bold font-mono text-slate-300 mt-1">{data.summary.p25} {unit}</div>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-blue-500/30">
                <div className="text-[10px] text-blue-400 uppercase font-semibold">Median (P50)</div>
                <div className="text-base font-bold font-mono text-white mt-1">{data.summary.median} {unit}</div>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">P75 (Q3)</div>
                <div className="text-base font-bold font-mono text-slate-300 mt-1">{data.summary.p75} {unit}</div>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">P90</div>
                <div className="text-base font-bold font-mono text-amber-300 mt-1">{data.summary.p90} {unit}</div>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">P95 / Max</div>
                <div className="text-base font-bold font-mono text-rose-400 mt-1">{data.summary.max} {unit}</div>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">IQR (Q3-Q1)</div>
                <div className="text-base font-bold font-mono text-emerald-300 mt-1">{data.summary.iqr} {unit}</div>
              </div>
            </div>

            {/* Interactive Observation Percentile Lookup */}
            <form onSubmit={handlePercentileLookup} className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Test Observation Percentile Rank:</span>
              </div>
              <input
                type="number"
                step="any"
                placeholder={`Enter observed value in ${unit}...`}
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                className="w-full sm:w-64 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Compute Rank
              </button>
              {lookupResult && (
                <div className="text-xs text-blue-300 font-medium bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-800">
                  {lookupResult}
                </div>
              )}
            </form>
          </div>

          {/* Main Chart Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {data.location} • Historical {selectedMetric.toUpperCase()} ({unit})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {data.dataPoints.length} records aggregated at {selectedAggregation} resolution
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Mean: <strong className="text-slate-200">{data.summary.mean} {unit}</strong>
              </span>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={data.dataPoints}>
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
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={`Observed (${unit})`}
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                    {showMA7 && (
                      <Line
                        type="monotone"
                        dataKey="rollingAvg7d"
                        name="7-Day MA"
                        stroke="#fbbf24"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                    {showMA30 && (
                      <Line
                        type="monotone"
                        dataKey="rollingAvg30d"
                        name="30-Day MA"
                        stroke="#34d399"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    )}
                  </LineChart>
                ) : (
                  <BarChart data={data.dataPoints}>
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
                      dataKey="value"
                      name={`Observed (${unit})`}
                      fill="#38bdf8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <DataProvenance provenance={data.provenance} />
        </>
      ) : null}
    </div>
  );
};
