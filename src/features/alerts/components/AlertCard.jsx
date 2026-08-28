import { getSeverityConfig, formatTimeAgo, formatTime } from '../utils.js';
export function AlertCard({ alert, onClick, isSelected, location }) {
  const sev = getSeverityConfig(alert.severity);
  const isExpired = alert.status === 'EXPIRED';
  const isUpdated = alert.version > 1;
  const isLocal = location?.district && alert.area?.includes(location.district);

  return (
    <article
      className={`alert-card ${isSelected ? 'selected' : ''} ${isExpired ? 'expired' : ''}`}
      style={{ borderLeftColor: sev.color }}
      onClick={() => onClick(alert)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(alert); } }}
      tabIndex={0}
      role="button"
      aria-label={`${alert.event}, ${sev.label} severity, ${alert.area || 'Unknown area'}`}
    >
      <div className="card-top">
        <span className="card-event">
          {alert.event} {isUpdated && <span className="status-tag" style={{background: '#e0f2fe', color: '#0369a1', fontSize: '0.7em', padding: '0.1rem 0.3rem', marginLeft: '0.5rem'}}>UPDATED</span>}
          {isLocal && <span className="status-tag" style={{background: '#dcfce7', color: '#166534', fontSize: '0.7em', padding: '0.1rem 0.3rem', marginLeft: '0.5rem'}}>LOCAL</span>}
        </span>
        <span className="severity-badge" style={{ color: sev.color, backgroundColor: sev.bg }}>
          <span aria-hidden="true">{sev.icon}</span> {sev.label}
        </span>
      </div>
      <div className="card-area">{alert.area || 'Area not specified'}</div>
      {alert.headline && <div className="card-headline">{alert.headline}</div>}
      <div className="card-meta">
        <span title={formatTime(alert.issuedAt)}>Issued {formatTimeAgo(alert.issuedAt)}</span>
        {alert.expiresAt && <span>Expires {formatTime(alert.expiresAt)}</span>}
        <span className="card-source" style={{display: 'flex', alignItems: 'center', gap: '0.2rem'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {alert.source === 'imd' ? 'Verified IMD Source' : alert.source?.toUpperCase()}
        </span>
        {isExpired && <span className="status-expired">EXPIRED</span>}
      </div>
    </article>
  );
}