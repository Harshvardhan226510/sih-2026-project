import React, { useState } from 'react';
import { ExtremeEventsResponse, ExtremeEvent } from '../types/analytics.js';
import { AlertTriangle, Flame, CloudRain, Wind, ShieldAlert, Filter, Search } from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  extremeData: ExtremeEventsResponse | null;
  loading: boolean;
}

export const ExtremeEvents: React.FC<Props> = ({ extremeData, loading }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!extremeData) return null;

  const filteredEvents = extremeData.events.filter((e) => {
    if (filterType !== 'ALL' && e.eventType !== filterType) return false;
    if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;
    if (searchQuery && !e.description.toLowerCase().includes(searchQuery.toLowerCase()) && !e.date.includes(searchQuery)) return false;
    return true;
  });

  const getSeverityBadge = (severity: ExtremeEvent['severity']) => {
    switch (severity) {
      case 'EXTREME':
        return <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">EXTREME</span>;
      case 'VERY_SEVERE':
        return <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-orange-950/80 text-orange-300 border border-orange-800">VERY SEVERE</span>;
      case 'SEVERE':
        return <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">SEVERE</span>;
      default:
        return <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800">MODERATE</span>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'HEAVY_RAINFALL': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'EXTREME_HEAT': return <Flame className="w-4 h-4 text-rose-400" />;
      case 'HIGH_WIND_GALE': return <Wind className="w-4 h-4 text-cyan-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Extreme Incidents</div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {extremeData.totalEvents}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Detected across {extremeData.timeRange.start} → {extremeData.timeRange.end}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Heavy Precipitation Days</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-400">
            {extremeData.breakdownByType['HEAVY_RAINFALL'] || 0}
          </div>
          <div className="mt-1 text-xs text-slate-400">&gt; 64.5 mm/24h (IMD Threshold)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Severe Heat Incidents</div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
            {extremeData.breakdownByType['EXTREME_HEAT'] || 0}
          </div>
          <div className="mt-1 text-xs text-slate-400">Tmax ≥ 40°C with +4.5°C Departure</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Gale & High Wind Surges</div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {extremeData.breakdownByType['HIGH_WIND_GALE'] || 0}
          </div>
          <div className="mt-1 text-xs text-slate-400">&gt; 55 km/h Peak Gusts</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Event Types</option>
              <option value="HEAVY_RAINFALL">Heavy Rainfall</option>
              <option value="EXTREME_HEAT">Extreme Heat</option>
              <option value="HIGH_WIND_GALE">High Wind / Gale</option>
              <option value="SEVERE_DEPRESSION">Severe Depression</option>
            </select>
          </div>

          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Severities</option>
              <option value="EXTREME">Extreme Only</option>
              <option value="VERY_SEVERE">Very Severe</option>
              <option value="SEVERE">Severe</option>
              <option value="MODERATE">Moderate</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search date or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3 font-mono text-right">Measured Value</th>
                <th className="px-4 py-3 font-mono text-right">%ile Rank</th>
                <th className="px-4 py-3">Applied IMD / WMO Threshold</th>
                <th className="px-4 py-3">Meteorological Synopsis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-200 font-semibold whitespace-nowrap">
                      {evt.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        {getEventIcon(evt.eventType)}
                        {evt.eventType.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getSeverityBadge(evt.severity)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-100 text-right whitespace-nowrap">
                      {evt.measuredValue} {evt.unit}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-amber-400 font-semibold whitespace-nowrap">
                      {evt.historicalPercentile}th
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {evt.thresholdApplied}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-300 max-w-xs">
                      {evt.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No extreme events matched the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DataProvenance provenance={extremeData.provenance} />
    </div>
  );
};
