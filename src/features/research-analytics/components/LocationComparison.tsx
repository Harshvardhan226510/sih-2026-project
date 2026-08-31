import React, { useState } from 'react';
import { LocationComparisonResponse, WeatherMetric } from '../types/analytics.js';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Scale, ArrowRight, Activity, Sparkles, CheckCircle2 } from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  comparisonData: LocationComparisonResponse | null;
  loading: boolean;
  locationA: string;
  locationB: string;
  selectedMetric: WeatherMetric;
  onLocationAChange: (loc: string) => void;
  onLocationBChange: (loc: string) => void;
}

export const LocationComparison: React.FC<Props> = ({
  comparisonData,
  loading,
  locationA,
  locationB,
  selectedMetric,
  onLocationAChange,
  onLocationBChange
}) => {
  const unit = selectedMetric === 'rainfall' ? 'mm' : '°C';
  const isRain = selectedMetric === 'rainfall';

  return (
    <div className="space-y-6">
      {/* City / District Selectors */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
              Primary Location (A)
            </label>
            <select
              value={locationA}
              onChange={(e) => onLocationAChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="Pune">Pune, Maharashtra</option>
              <option value="Mumbai">Mumbai, Maharashtra</option>
              <option value="Delhi">Delhi, NCR</option>
              <option value="Bengaluru">Bengaluru, Karnataka</option>
              <option value="Chennai">Chennai, Tamil Nadu</option>
              <option value="Kolkata">Kolkata, West Bengal</option>
              <option value="Hyderabad">Hyderabad, Telangana</option>
            </select>
          </div>

          <div className="shrink-0 mt-4 sm:mt-5 text-slate-500">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
              Comparison Location (B)
            </label>
            <select
              value={locationB}
              onChange={(e) => onLocationBChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="Mumbai">Mumbai, Maharashtra</option>
              <option value="Pune">Pune, Maharashtra</option>
              <option value="Delhi">Delhi, NCR</option>
              <option value="Bengaluru">Bengaluru, Karnataka</option>
              <option value="Chennai">Chennai, Tamil Nadu</option>
              <option value="Kolkata">Kolkata, West Bengal</option>
              <option value="Hyderabad">Hyderabad, Telangana</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : comparisonData ? (
        <>
          {/* Side-by-Side KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location A Card */}
            <div className="bg-slate-900/90 border border-blue-500/40 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">LOCATION A</span>
                  <h3 className="text-xl font-bold text-white">{comparisonData.locationA.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total / Mean</div>
                  <div className="text-xl font-bold font-mono text-blue-400">
                    {isRain ? comparisonData.locationA.stats.totalSum : comparisonData.locationA.stats.mean} {unit}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono text-center">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">PEAK MAX</div>
                  <div className="font-bold text-slate-200 mt-0.5">{comparisonData.locationA.stats.max} {unit}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">EXTREMES</div>
                  <div className="font-bold text-rose-400 mt-0.5">{comparisonData.locationA.extremeEventsCount} Events</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">STD DEV</div>
                  <div className="font-bold text-slate-300 mt-0.5">{comparisonData.locationA.stats.stdDev}</div>
                </div>
              </div>
            </div>

            {/* Location B Card */}
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">LOCATION B</span>
                  <h3 className="text-xl font-bold text-white">{comparisonData.locationB.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total / Mean</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {isRain ? comparisonData.locationB.stats.totalSum : comparisonData.locationB.stats.mean} {unit}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono text-center">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">PEAK MAX</div>
                  <div className="font-bold text-slate-200 mt-0.5">{comparisonData.locationB.stats.max} {unit}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">EXTREMES</div>
                  <div className="font-bold text-rose-400 mt-0.5">{comparisonData.locationB.extremeEventsCount} Events</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">STD DEV</div>
                  <div className="font-bold text-slate-300 mt-0.5">{comparisonData.locationB.stats.stdDev}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Time Series Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" />
                Synchronized Comparative Time Series ({comparisonData.locationA.name} vs {comparisonData.locationB.name})
              </h3>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData.timeSeries} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any, name: string) => [`${val} ${unit}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="valueA" stroke="#3b82f6" strokeWidth={2} dot={false} name={comparisonData.locationA.name} />
                  <Line type="monotone" dataKey="valueB" stroke="#10b981" strokeWidth={2} dot={false} name={comparisonData.locationB.name} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Explanation Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Comparative Meteorological Synthesis</h3>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
              {comparisonData.analyticalExplanation}
            </p>
          </div>

          <DataProvenance provenance={comparisonData.provenance} />
        </>
      ) : null}
    </div>
  );
};
