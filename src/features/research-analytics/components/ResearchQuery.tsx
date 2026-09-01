import React, { useState } from 'react';
import { ResearchQueryResponse } from '../types/analytics.js';
import { executeResearchQuery } from '../services/analyticsApi.js';
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
  Sparkles, 
  Search, 
  Send, 
  CheckCircle2, 
  Database, 
  Activity, 
  Layers, 
  HelpCircle 
} from 'lucide-react';
import { DataProvenance } from './DataProvenance.js';

export const ResearchQuery: React.FC = () => {
  const [query, setQuery] = useState<string>('Compare monsoon rainfall in Pune and Mumbai from 2015 to 2024.');
  const [result, setResult] = useState<ResearchQueryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const sampleQueries = [
    'Compare monsoon rainfall in Pune and Mumbai from 2015 to 2024.',
    'Is rainfall in Mumbai unusual compared to historical baseline?',
    'What is the long-term temperature trend in Delhi from 2010 to 2024?',
    'Detect extreme weather events in Bengaluru over the last 5 years.',
    'Show historical precipitation in Shimla between 2018 and 2023.'
  ];

  const handleSearch = async (queryText?: string) => {
    const q = queryText || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await executeResearchQuery(q);
      setResult(res);
    } catch (err) {
      console.error('Failed to execute research query:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">
            Natural Language Meteorological Research Engine
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Ask complex historical, comparative, anomaly, or extreme-weather questions in natural language. The backend interprets the query and computes deterministic analytics without AI numerical hallucination.
        </p>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Compare monsoon rainfall in Pune and Mumbai from 2015 to 2025..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Send className="w-4 h-4" />}
            <span>Analyze</span>
          </button>
        </div>

        {/* Preset Sample Prompt Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold uppercase">Suggestions:</span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(sample);
                handleSearch(sample);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Query Result View */}
      {result && (
        <div className="space-y-6">
          {/* Parsed Intent Pedigree */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Parsed Intent & Query Parameters
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 bg-slate-950 rounded border border-slate-800 text-blue-400">
                Type: {result.parsedIntent.type}
              </span>
              <span className="px-2.5 py-1 bg-slate-950 rounded border border-slate-800 text-emerald-400">
                Metric: {result.parsedIntent.metric}
              </span>
              <span className="px-2.5 py-1 bg-slate-950 rounded border border-slate-800 text-amber-400">
                Locations: {result.parsedIntent.locations.join(', ')}
              </span>
              <span className="px-2.5 py-1 bg-slate-950 rounded border border-slate-800 text-purple-400">
                Range: {result.parsedIntent.dateRange.start} → {result.parsedIntent.dateRange.end}
              </span>
            </div>
          </div>

          {/* AI Evidence Synthesis & Key Insights */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Analytical Synthesis</h3>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
              {result.analyticalExplanation}
            </p>

            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase">Key Empirical Findings:</div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Auto-Generated Chart Viewport */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Auto-Generated Evidence Chart
              </h3>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {result.chartType === 'comparison-line' && result.analyticsData.timeSeries ? (
                  <LineChart data={result.analyticsData.timeSeries} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="valueA" stroke="#3b82f6" strokeWidth={2} dot={false} name={result.analyticsData.locationA?.name || 'Location A'} />
                    <Line type="monotone" dataKey="valueB" stroke="#10b981" strokeWidth={2} dot={false} name={result.analyticsData.locationB?.name || 'Location B'} />
                  </LineChart>
                ) : result.analyticsData.series ? (
                  <LineChart data={result.analyticsData.series} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Observed" />
                    <Line type="linear" dataKey="trendLine" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" name="Trend" />
                  </LineChart>
                ) : (
                  <BarChart data={result.analyticsData.dataPoints || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1329', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Observed" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <DataProvenance provenance={result.provenance} />
        </div>
      )}
    </div>
  );
};
