import React, { useState } from 'react';
import { DataProvenance as IDataProvenance } from '../types/analytics.js';
import { Database, ShieldCheck, Info, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  provenance?: IDataProvenance;
  compact?: boolean;
}

export const DataProvenance: React.FC<Props> = ({ provenance, compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);

  if (!provenance) return null;

  const isDemo = provenance.isDemo || provenance.dataQualityStatus === 'DEMO_DATA';

  return (
    <div className="mt-4 border border-slate-800 bg-slate-900/80 rounded-xl overflow-hidden backdrop-blur-sm">
      <div 
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors border-b border-slate-800/60"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Scientific Data Provenance & Lineage
          </span>
          {isDemo ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800/80">
              <AlertTriangle className="w-3 h-3" />
              Demo Reference Dataset
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
              <CheckCircle2 className="w-3 h-3" />
              Quality Verified ({provenance.dataQualityStatus})
            </span>
          )}
        </div>
        <button className="text-slate-400 hover:text-slate-200">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              PRIMARY SOURCE & DATASET
            </div>
            <div className="font-semibold text-slate-200">{provenance.source}</div>
            <div className="text-slate-400 text-[11px] mt-0.5">{provenance.dataset}</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="text-slate-400 font-medium mb-1">LOCATION & COORDINATES</div>
            <div className="font-semibold text-slate-200">{provenance.location}</div>
            <div className="text-slate-400 text-[11px] font-mono mt-0.5">
              Lat: {provenance.coordinates.lat.toFixed(4)}° N, Lon: {provenance.coordinates.lon.toFixed(4)}° E
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="text-slate-400 font-medium mb-1">SAMPLE SIZE & RANGE</div>
            <div className="font-semibold text-slate-200">
              {provenance.observationCount.toLocaleString()} {provenance.aggregationPeriod || 'daily'} records
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              {provenance.timeRange.start} → {provenance.timeRange.end}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              CALCULATION METHOD
            </div>
            <div className="text-slate-300 font-mono text-[11px] leading-relaxed">
              {provenance.calculationMethod}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
