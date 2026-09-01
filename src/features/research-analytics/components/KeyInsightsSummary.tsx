import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Flame, Scale } from 'lucide-react';

interface KeyInsightsProps {
  insights: Array<{
    id: string;
    type: 'trend' | 'anomaly' | 'extreme' | 'comparison' | 'distribution';
    title: string;
    description: string;
    metricValue?: string;
    isSignificant?: boolean;
  }>;
}

export const KeyInsightsSummary: React.FC<KeyInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      case 'anomaly': return <Flame className="w-4 h-4 text-rose-400" />;
      case 'extreme': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'comparison': return <Scale className="w-4 h-4 text-blue-400" />;
      default: return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Key Research Insights (Statistically Validated)
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Deterministic Calculations
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((item) => (
          <div 
            key={item.id}
            className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  {getIcon(item.type)}
                  {item.title}
                </span>
                {item.isSignificant !== undefined && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    item.isSignificant 
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {item.isSignificant ? 'p < 0.05' : 'Observed'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
            {item.metricValue && (
              <div className="mt-2 pt-1.5 border-t border-slate-900 text-xs font-mono font-bold text-white">
                {item.metricValue}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
