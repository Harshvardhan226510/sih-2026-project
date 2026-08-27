import { getSeverityConfig, formatTimeAgo, formatTime } from '../utils.js';
export function AlertCard({ alert, onClick, isSelected }) {
  const sev = getSeverityConfig(alert.severity);
  const isExpired = alert.status === 'EXPIRED';
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
        <span className="card-event">{alert.event}</span>
        <span className="severity-badge" style={{ color: sev.color, backgroundColor: sev.bg }}>
          <span aria-hidden="true">{sev.icon}</span> {sev.label}
        </span>
      </div>
      <div className="card-area">{alert.area || 'Area not specified'}</div>
      {alert.headline && <div className="card-headline">{alert.headline}</div>}
      <div className="card-meta">
        <span title={formatTime(alert.issuedAt)}>Issued {formatTimeAgo(alert.issuedAt)}</span>
        {alert.expiresAt && <span>Expires {formatTime(alert.expiresAt)}</span>}
        <span className="card-source">Source: {alert.source === 'imd' ? 'IMD' : alert.source?.toUpperCase()}</span>
        {isExpired && <span className="status-expired">EXPIRED</span>}
      </div>
    </article>
  );
}