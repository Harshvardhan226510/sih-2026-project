import React, { useState, useEffect } from 'react';
import { History, Clock, ArrowRight, RotateCcw, MapPin } from 'lucide-react';
import { fetchRecentQueries } from '../services/analyticsApi.js';
import { RecentQueryEntry } from '../types/analytics.js';

interface RecentQueriesWidgetProps {
  onRestoreQuery: (query: RecentQueryEntry) => void;
}

export const RecentQueriesWidget: React.FC<RecentQueriesWidgetProps> = ({ onRestoreQuery }) => {
  const [queries, setQueries] = useState<RecentQueryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchRecentQueries(8)
      .then(data => {
        setQueries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load recent queries:', err);
        setLoading(false);
      });
  }, []);

  if (queries.length === 0 && !loading) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Recent Research Queries
          </span>
          <span className="text-[10px] text-slate-500 font-mono">({queries.length})</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {queries.map((q) => (
            <button
              key={q.id}
              onClick={() => onRestoreQuery(q)}
              className="group text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-lg px-2.5 py-1.5 transition-all text-xs flex items-center gap-2"
            >
              <MapPin className="w-3 h-3 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="truncate max-w-[220px]">
                <div className="font-medium text-slate-200 truncate">{q.title}</div>
                <div className="text-[10px] text-slate-400 truncate">
                  {q.params?.metric || 'rainfall'} • {q.params?.start || ''} → {q.params?.end || ''}
                </div>
              </div>
              <RotateCcw className="w-3 h-3 text-slate-500 group-hover:text-blue-300 ml-1 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
