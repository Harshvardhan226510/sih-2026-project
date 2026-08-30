import { getSeverityConfig, formatTimeAgo, formatTime, getWeatherImageForEvent } from '../utils.js';

export function AlertCard({ alert, onClick, isSelected, location }) {
  const sev = getSeverityConfig(alert.severity);
  const isExpired = alert.status === 'EXPIRED';
  const isUpdated = alert.version > 1;
  const isLocal = location?.district && alert.area?.includes(location.district);

  const bgImage = getWeatherImageForEvent(alert.event);

  return (
    <article
      className={`alert-card ${isSelected ? 'selected' : ''} ${isExpired ? 'expired' : ''}`}
      style={{ borderColor: isSelected ? 'var(--text-main)' : 'var(--border-subtle)' }}
      onClick={() => onClick(alert)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(alert); } }}
      tabIndex={0}
      role="button"
      aria-label={`${alert.event}, ${sev.label} severity, ${alert.area || 'Unknown area'}`}
    >
      {/* 1. LARGE WEATHER IMAGE / HERO AREA */}
      <div className="card-hero" style={{ backgroundImage: `url('${bgImage}')` }}>
        <div className="card-hero-overlay"></div>
        <div className="card-hero-content">
          <div className="card-badges">
            <span className="severity-badge" style={{ color: '#fff', backgroundColor: sev.color }}>
              <span aria-hidden="true">{sev.icon}</span> {sev.label}
            </span>
            <span className="verified-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Verified IMD
            </span>
          </div>

          <div className="card-hero-bottom">
            <h3 className="card-event-title">{alert.event}</h3>
            <div className="card-location-row">
              <span aria-hidden="true">📍</span> {alert.area || 'Area not specified'}
              {isLocal && <span className="tag-local">LOCAL</span>}
              {isUpdated && <span className="tag-updated">UPDATED</span>}
              {isExpired && <span className="tag-expired">EXPIRED</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLEAN INFORMATION AREA BELOW */}
      <div className="card-info-area">
        {alert.description && (
          <p className="card-description">{alert.description}</p>
        )}
        
        <div className="card-footer">
          <div className="meta-text">
            <span title={formatTime(alert.issuedAt)}>Issued {formatTimeAgo(alert.issuedAt)}</span>
            {alert.expiresAt && <span className="meta-divider">•</span>}
            {alert.expiresAt && <span>Expires {formatTime(alert.expiresAt)}</span>}
          </div>
          <button className="card-action-btn" tabIndex="-1">
            View Details <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}