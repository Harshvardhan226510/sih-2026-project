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
    <div className="alert-detail-overlay" onClick={onClose}>
      <aside 
        className="alert-detail-drawer" 
        onClick={e => e.stopPropagation()} 
        role="dialog" 
        aria-label="Alert details"
      >
        <div className="detail-drawer-header">
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close detail panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Close</span>
          </button>

          <span className="badge-imd-verified">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            OFFICIAL IMD CAP ALERT
          </span>
        </div>
        
        <div className="detail-drawer-body">
          {/* Severity & Event Title */}
          <div className="flex flex-col gap-2">
            <span 
              className="detail-severity-banner"
              style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
            >
              <span>{sev.icon}</span> {sev.label} SEVERITY
            </span>
            <h2 className="detail-hero-title">{data.event}</h2>
          </div>

          {/* Area & Timestamps Box */}
          <div className="detail-location-time-box">
            <div className="flex items-center gap-2 text-slate-100 font-medium">
              <span>📍</span>
              <span>{data.area || 'Unknown area'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-2 border-t border-white/5">
              <div>Issued: <strong>{data.issuedAt ? formatDateTime(data.issuedAt) : '—'}</strong></div>
              {data.expiresAt && (
                <div>Expires: <strong>{formatDateTime(data.expiresAt)}</strong></div>
              )}
            </div>
          </div>

          {/* Description Section */}
          {data.description && (
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Meteorological Synopsis
              </span>
              <p className="bg-slate-900/60 p-3 rounded-lg border border-white/5">
                {data.description}
              </p>
            </div>
          )}

          {/* Official IMD Instructions */}
          {data.instruction && (
            <div className="detail-highlight-card detail-instructions-card">
              <h4>
                <span>⚠️</span>
                Official IMD Public Advisory & Instructions
              </h4>
              <p>{data.instruction}</p>
            </div>
          )}

          {/* WeatherGPT Grounded AI Summary */}
          <div className="detail-highlight-card detail-ai-summary-card">
            <h4>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
              </svg>
              WeatherGPT Synthesis
            </h4>
            <p>
              This is a <strong>{sev.label}</strong> severity meteorological event for <strong>{data.event}</strong> affecting <strong>{data.area || 'the region'}</strong>. {data.status === 'ACTIVE' ? `Remain alert until ${data.expiresAt ? formatDateTime(data.expiresAt) : 'further notice'}. Follow all official IMD emergency protocols.` : 'This alert has expired.'}
            </p>
          </div>

          {/* Technical Metadata Accordion */}
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => setShowTech(!showTech)}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center justify-between w-full py-2"
            >
              <span>Technical CAP Telemetry & Identifiers</span>
              <span>{showTech ? '▲' : '▼'}</span>
            </button>
            
            {showTech && (
              <div className="mt-2 bg-slate-950 p-3 rounded-lg border border-white/5 font-mono text-[11px] space-y-1.5 text-slate-400">
                <div><span className="text-slate-500">CAP Identifier:</span> <span className="text-slate-300">{data.id}</span></div>
                <div><span className="text-slate-500">Sender / Bureau:</span> <span className="text-slate-300">{data.sender || 'IMD / National Weather Service'}</span></div>
                <div><span className="text-slate-500">Certainty / Urgency:</span> <span className="text-slate-300">{data.certainty || 'Observed'} / {data.urgency || 'Immediate'}</span></div>
                <div><span className="text-slate-500">Version Sequence:</span> <span className="text-slate-300">v{data.version || 1}</span></div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}