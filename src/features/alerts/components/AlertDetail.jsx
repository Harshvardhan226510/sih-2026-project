import { useState, useEffect } from 'react';
import { getSeverityConfig, formatDateTime } from '../utils.js';
import { fetchAlert, fetchAlertHistory } from '../services/alertApi.js';

export function AlertDetail({ alert, onClose, networkOnline }) {
  const [full, setFull] = useState(null);
  const [history, setHistory] = useState([]);
  const [showTech, setShowTech] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  
  const data = full || alert;
  const sev = getSeverityConfig(data.severity);
  
  useEffect(() => {
    setFull(null);
    setHistory([]);
    if (networkOnline) {
      fetchAlert(alert.id).then(setFull).catch(() => {});
      if (alert.version > 1) {
        fetchAlertHistory(alert.id).then(setHistory).catch(() => {});
      }
    }
  }, [alert.id, networkOnline, alert.version]);
  
  const isCompact = !data.headline && !data.description && !data.issuedAt;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end transition-all" onClick={onClose}>
      <aside 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col transform transition-transform border-l border-slate-200 overflow-hidden" 
        onClick={e => e.stopPropagation()} 
        role="dialog" 
        aria-label="Alert details"
      >
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shrink-0">
          <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-semibold" onClick={onClose} aria-label="Close detail panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Close</span>
          </button>

          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200 text-slate-600 text-[9px] font-bold tracking-wider uppercase">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            OFFICIAL IMD CAP ALERT
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50">
          {/* Severity & Event Title */}
          <div className="flex flex-col gap-2">
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase self-start shadow-sm"
              style={{ backgroundColor: sev.color + '20', color: sev.color, border: `1px solid ${sev.color}40` }}
            >
              <span>{sev.icon}</span> {sev.label} SEVERITY
            </span>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">{data.event}</h2>
          </div>

          {/* Area & Timestamps Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
              <span>📍</span>
              <span>{data.area || 'Unknown area'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
              <div>Issued: <strong className="text-slate-700">{data.issuedAt ? formatDateTime(data.issuedAt) : '—'}</strong></div>
              {data.expiresAt && (
                <div>Expires: <strong className="text-slate-700">{formatDateTime(data.expiresAt)}</strong></div>
              )}
            </div>
          </div>

          {/* Description Section */}
          {data.description && (
            <div className="text-sm text-slate-700 leading-relaxed">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Meteorological Synopsis
              </span>
              <p className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm whitespace-pre-wrap">
                {data.description}
              </p>
            </div>
          )}

          {/* Official IMD Instructions */}
          {data.instruction && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
              <h4 className="flex items-center gap-2 text-red-800 font-bold mb-2">
                <span>⚠️</span>
                Official IMD Public Advisory & Instructions
              </h4>
              <p className="text-sm text-red-700 leading-relaxed font-medium">{data.instruction}</p>
            </div>
          )}

          {/* WeatherGPT Grounded AI Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 shadow-sm">
            <h4 className="flex items-center gap-2 text-blue-800 font-bold mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
              </svg>
              AI Synthesis
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed font-medium">
              This is a <strong className="text-blue-900">{sev.label}</strong> severity meteorological event for <strong className="text-blue-900">{data.event}</strong> affecting <strong className="text-blue-900">{data.area || 'the region'}</strong>. {data.status === 'ACTIVE' ? `Remain alert until ${data.expiresAt ? formatDateTime(data.expiresAt) : 'further notice'}. Follow all official IMD emergency protocols.` : 'This alert has expired.'}
            </p>
          </div>

          {/* Technical Metadata Accordion */}
          <div className="pt-2 border-t border-slate-200 mt-2">
            <button
              onClick={() => setShowTech(!showTech)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center justify-between w-full py-2 transition-colors"
            >
              <span>Technical CAP Telemetry & Identifiers</span>
              <span>{showTech ? '▲' : '▼'}</span>
            </button>
            
            {showTech && (
              <div className="mt-2 bg-slate-100 p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-2 text-slate-600 shadow-inner">
                <div><span className="text-slate-400">CAP Identifier:</span> <span className="text-slate-800 font-semibold">{data.id}</span></div>
                <div><span className="text-slate-400">Sender / Bureau:</span> <span className="text-slate-800 font-semibold">{data.sender || 'IMD / National Weather Service'}</span></div>
                <div><span className="text-slate-400">Certainty / Urgency:</span> <span className="text-slate-800 font-semibold">{data.certainty || 'Observed'} / {data.urgency || 'Immediate'}</span></div>
                <div><span className="text-slate-400">Version Sequence:</span> <span className="text-slate-800 font-semibold">v{data.version || 1}</span></div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}