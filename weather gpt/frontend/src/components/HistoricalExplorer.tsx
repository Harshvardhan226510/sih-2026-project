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
  Info 
} from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  data: HistoricalAnalyticsResponse | null;
  loading: boolean;
  selectedLocation: string;
  startDate: string;
  endDate: string;
  selectedMetric: WeatherMetric;
  selectedAggregation: AggregationPeriod;
  onLocationChange: (loc: string) => void;
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

  const unit = data?.summary.unit || 'mm';

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!data || !data.dataPoints || data.dataPoints.length === 0) return;

    const headers = ['Date', `Value (${unit})`, 'Min', 'Max', 'RollingAvg7d', 'RollingAvg30d'];
    const rows = data.dataPoints.map(p => [
      p.date,
      p.value,
      p.min ?? '',
      p.max ?? '',
      p.rollingAvg7d ?? '',
      p.rollingAvg30d ?? ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WeatherGPT_${selectedLocation}_${selectedMetric}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="Pune">Pune, Maharashtra</option>
              <option value="Mumbai">Mumbai, Maharashtra</option>
              <option value="Delhi">Delhi, NCR</option>
              <option value="Bengaluru">Bengaluru, Karnataka</option>
              <option value="Chennai">Chennai, Tamil Nadu</option>
              <option value="Kolkata">Kolkata, West Bengal</option>
              <option value="Hyderabad">Hyderabad, Telangana</option>
              <option value="Ahmedabad">Ahmedabad, Gujarat</option>
              <option value="Jaipur">Jaipur, Rajasthan</option>
              <option value="Shimla">Shimla, Himachal Pradesh</option>
              <option value="Kochi">Kochi, Kerala</option>
            </select>
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
              <option value="rainfall">Precipitation / Rainfall (mm)</option>
              <option value="temperature">Mean Air Temperature (°C)</option>
              <option value="temp_max">Maximum Temperature (°C)</option>
              <option value="temp_min">Minimum Temperature (°C)</option>
              <option value="humidity">Relative Humidity (%)</option>
              <option value="wind_speed">Wind Speed (km/h)</option>
              <option value="pressure">Surface Pressure (hPa)</option>
              <option value="cloud_cover">Cloud Cover (%)</option>
            </select>
          </div>

          {/* Aggregation Interval */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Temporal Aggregation
            </label>
            <select
              value={selectedAggregation}
              onChange={(e) => onAggregationChange(e.target.value as AggregationPeriod)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="daily">Daily Aggregation</option>
              <option value="weekly">Weekly Sum/Mean</option>
              <option value="monthly">Monthly Sum/Mean</option>
              <option value="yearly">Yearly Climatology</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Date Range (Start → End)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onDateChange(e.target.value, endDate)}
                className="w-1/2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 text-xs">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onDateChange(startDate, e.target.value)}
                className="w-1/2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Time Series Chart Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Historical {selectedMetric.toUpperCase()} Time Series
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {data?.location} • {data?.dataPoints.length} aggregated time steps ({startDate} to {endDate})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setChartType('line')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Line
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Bar
              </button>
            </div>

            {/* Rolling Average Filters */}
            <button
              onClick={() => setShowMA7(!showMA7)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
                showMA7 ? 'bg-amber-950/60 border-amber-800 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              7-Step MA
            </button>
            <button
              onClick={() => setShowMA30(!showMA30)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
                showMA30 ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              30-Step MA
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-80 w-full mt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : data && data.dataPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={data.dataPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any, name: string) => [`${val} ${unit}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} name={`Observed (${unit})`} />
                  {showMA7 && <Line type="monotone" dataKey="rollingAvg7d" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="7-Step MA" />}
                  {showMA30 && <Line type="monotone" dataKey="rollingAvg30d" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="30-Step MA" />}
                </LineChart>
              ) : (
                <BarChart data={data.dataPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} ${unit}`, `Observed (${unit})`]}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} name={`Observed (${unit})`} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No historical data available for the chosen parameters.
            </div>
          )}
        </div>
      </div>

      {/* Statistical Distribution Table */}
      {data && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-400" />
              Climatological Distribution & Percentile Metrics
            </h3>
            <span className="text-xs text-slate-400">Sample size: {data.provenance.observationCount} observations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[11px] font-sans">MINIMUM</div>
              <div className="text-base font-bold text-slate-200 mt-1">{data.summary.min} {unit}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[11px] font-sans">MEAN</div>
              <div className="text-base font-bold text-blue-400 mt-1">{data.summary.mean} {unit}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[11px] font-sans">MEDIAN (P50)</div>
              <div className="text-base font-bold text-slate-200 mt-1">{data.summary.median} {unit}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[11px] font-sans">MAXIMUM</div>
              <div className="text-base font-bold text-rose-400 mt-1">{data.summary.max} {unit}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[11px] font-sans">STD DEV (σ)</div>
              <div className="text-base font-bold text-slate-300 mt-1">{data.summary.stdDev}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[11px] font-sans">25th %ILE</div>
              <div className="text-base font-bold text-slate-300 mt-1">{data.summary.p25} {unit}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[11px] font-sans">75th %ILE</div>
              <div className="text-base font-bold text-slate-300 mt-1">{data.summary.p75} {unit}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[11px] font-sans">95th %ILE</div>
              <div className="text-base font-bold text-amber-400 mt-1">{data.summary.p95} {unit}</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Provenance Panel */}
      <DataProvenance provenance={data?.provenance} />
    </div>
  );
};
