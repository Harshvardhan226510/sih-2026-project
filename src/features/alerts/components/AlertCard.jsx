import { getSeverityConfig, formatTimeAgo, formatTime } from '../utils.js';

export function AlertCard({ alert, onClick, isSelected, location }) {
  const sev = getSeverityConfig(alert.severity);
  const isExpired = alert.status === 'EXPIRED';
  const isLocal = location?.district && alert.area?.toLowerCase().includes(location.district.toLowerCase());

  return (
    <article
      className={`relative px-6 py-4 transition-colors cursor-pointer group flex items-center justify-between outline-none ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50 bg-white'}`}
      onClick={() => onClick(alert)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(alert); } }}
      tabIndex={0}
      role="row"
      aria-label={`${alert.type || alert.event}, ${sev.label} severity, ${alert.area || 'Unknown area'}`}
    >
      {/* Selection Indicator */}
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md" aria-hidden="true" />}
      
      {/* 1. Severity & Event */}
      <div className="flex-[2] flex flex-col pr-4 border-r border-slate-100 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sev.color }} aria-hidden="true" />
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            {sev.label}
          </span>
          {isExpired && (
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Expired
            </span>
          )}
        </div>
        <h4 className="text-sm font-semibold text-slate-900 leading-tight truncate group-hover:text-blue-700 transition-colors">
          {alert.type || alert.title || alert.event || 'Weather Alert'}
        </h4>
      </div>

      {/* 2. Target Area */}
      <div className="flex-[3] px-4 border-r border-slate-100 min-w-0 flex flex-col justify-center">
        <div className="flex items-start text-xs font-medium text-slate-700">
          <span className="mr-1.5 text-slate-400 mt-0.5 flex-shrink-0">📍</span>
          <span className="line-clamp-2 leading-snug">{alert.area || 'Region not specified'}</span>
        </div>
        {isLocal && (
          <span className="mt-1.5 self-start text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
            Near You
          </span>
        )}
      </div>

      {/* 3. Validity Period */}
      <div className="flex-[2] pl-4 flex items-center justify-end min-w-0">
        <div className="text-[11px] text-right font-medium text-slate-500 flex flex-col justify-center">
          <span className="whitespace-nowrap">Issued {formatTimeAgo(alert.issued_at || alert.issuedAt)}</span>
          {(alert.valid_to || alert.expiresAt) && (
            <span className="whitespace-nowrap mt-0.5">Expires {formatTime(alert.valid_to || alert.expiresAt)}</span>
          )}
        </div>
        <div className="ml-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </article>
  );
}