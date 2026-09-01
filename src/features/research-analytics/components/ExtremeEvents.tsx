import React, { useState } from 'react';
import { ExtremeEventsResponse, ExtremeEvent, WeatherMetric } from '../types/analytics.js';
import { 
  AlertTriangle, 
  Flame, 
  CloudRain, 
  Wind, 
  ShieldAlert, 
  Filter, 
  Search,
  Clock,
  RotateCcw,
  Trophy,
  Activity,
  Layers
} from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

interface Props {
  extremeData: ExtremeEventsResponse | null;
  loading: boolean;
  onFilterChange?: (metric: string, threshold?: number, topN?: number) => void;
}

export const ExtremeEvents: React.FC<Props> = ({ extremeData, loading, onFilterChange }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [topNFilter, setTopNFilter] = useState<number | 'ALL'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'explorer' | 'recurrence'>('explorer');

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!extremeData) return null;

  let filteredEvents = extremeData.events.filter((e) => {
    if (filterType !== 'ALL' && e.eventType !== filterType) return false;
    if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;
    if (searchQuery && !e.description.toLowerCase().includes(searchQuery.toLowerCase()) && !e.date.includes(searchQuery)) return false;
    return true;
  });

  if (topNFilter !== 'ALL') {
    filteredEvents = filteredEvents.slice(0, topNFilter);
  }

  const getSeverityBadge = (severity: ExtremeEvent['severity']) => {
    switch (severity) {
      case 'EXTREME':
        return <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">EXTREME</span>;
      case 'VERY_SEVERE':
        return <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-orange-950/80 text-orange-300 border border-orange-800">VERY SEVERE</span>;
      case 'SEVERE':
        return <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">SEVERE</span>;
      default:
        return <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800">MODERATE</span>;
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

  const recurrence = extremeData.recurrenceAnalysis;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('explorer')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'explorer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Extreme-Event Explorer & Severity Rankings
          </button>
          <button
            onClick={() => setActiveSubTab('recurrence')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'recurrence'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Historical Event Recurrence Analysis
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:block pr-3 font-mono">
          Total Incidents: <strong className="text-white">{extremeData.totalEvents}</strong>
        </span>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Extreme Incidents</div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {extremeData.totalEvents}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Across {extremeData.timeRange.start} → {extremeData.timeRange.end}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Heavy Precipitation Days</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-400">
            {extremeData.breakdownByType['HEAVY_RAINFALL'] || 0}
          </div>
          <div className="mt-1 text-xs text-slate-400">&gt; 64.5 mm/24h (IMD Criteria)</div>
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
          <div className="mt-1 text-xs text-slate-400">&gt; 55 km/h Peak Wind</div>
        </div>
      </div>

      {activeSubTab === 'explorer' ? (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="HEAVY_RAINFALL">Heavy Rainfall</option>
                  <option value="EXTREME_HEAT">Extreme Heat / Heatwave</option>
                  <option value="HIGH_WIND_GALE">Gale / High Wind</option>
                  <option value="SEVERE_DEPRESSION">Cyclonic Depression</option>
                </select>
              </div>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="EXTREME">Extreme Severity</option>
                <option value="VERY_SEVERE">Very Severe</option>
                <option value="SEVERE">Severe</option>
                <option value="MODERATE">Moderate</option>
              </select>

              <select
                value={topNFilter}
                onChange={(e) => setTopNFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">Show All Events</option>
                <option value="5">Top 5 Highest</option>
                <option value="10">Top 10 Highest</option>
                <option value="20">Top 20 Highest</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by date or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Extreme Events Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">Rank / Date</th>
                    <th className="py-3 px-4">Event Category</th>
                    <th className="py-3 px-4">Observed Value</th>
                    <th className="py-3 px-4">Applied Criteria / Threshold</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Historical Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event, idx) => (
                      <tr key={event.id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {event.rank && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                                #{event.rank}
                              </span>
                            )}
                            <span className="font-bold text-slate-200">{event.date}</span>
                          </div>
                          {event.rankLabel && (
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                              {event.rankLabel}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-200 font-sans font-medium">
                            {getEventIcon(event.eventType)}
                            <span>{event.eventType.replace(/_/g, ' ')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-400">
                          {event.measuredValue} {event.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-sans text-[11px] max-w-xs truncate">
                          {event.thresholdApplied}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {getSeverityBadge(event.severity)}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans text-xs max-w-xs">
                          {event.description}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        No extreme events matched the selected criteria for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Event Recurrence Analysis View */
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-400" />
              Historical Extreme Event Recurrence & Interval Analysis
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Calculates deterministic historical intervals between successive threshold events. Labeled as <strong>historical event intervals</strong> (empirical observations).
            </p>

            {recurrence && recurrence.intervals.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-semibold text-slate-400 uppercase">Average Interval</div>
                    <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                      {recurrence.averageIntervalDays} days
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">
                      (~{recurrence.averageIntervalYears} years between occurrences)
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-semibold text-slate-400 uppercase">Shortest Historical Gap</div>
                    <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                      {recurrence.minIntervalDays} days
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate font-mono">
                      {recurrence.shortestInterval || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs font-semibold text-slate-400 uppercase">Longest Historical Gap</div>
                    <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                      {recurrence.maxIntervalDays} days
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate font-mono">
                      {recurrence.longestInterval || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Recurrence Intervals Timeline */}
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">
                  Sequence of Successive Historical Intervals
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {recurrence.intervals.map((int, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-slate-300">{int.from}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-slate-300">{int.to}</span>
                      </div>
                      <div className="font-bold text-slate-200">
                        {int.days} days <span className="text-slate-500 text-[10px]">({int.years} yrs)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs font-sans">
                Insufficient consecutive events in selected date range to calculate inter-event intervals.
              </div>
            )}
          </div>
        </div>
      )}

      <DataProvenance provenance={extremeData.provenance} />
    </div>
  );
};
