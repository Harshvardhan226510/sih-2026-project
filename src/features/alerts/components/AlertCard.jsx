import { getSeverityConfig, formatTimeAgo, formatTime, getWeatherImageForEvent } from '../utils.js';

export function AlertCard({ alert, onClick, isSelected, isPrimary, location }) {
  const sev = getSeverityConfig(alert.severity);
  const isExpired = alert.status === 'EXPIRED';
  const isUpdated = alert.version > 1;
  const isLocal = location?.district && alert.area?.includes(location.district);
  const bgImage = getWeatherImageForEvent(alert.event);

  // ==========================================
  // 1. PRIMARY PRIORITY ALERT CARD
  // ==========================================
  if (isPrimary) {
    return (
      <article
        className={`primary-alert-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onClick(alert)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(alert); } }}
        tabIndex={0}
        role="button"
        aria-label={`Primary Alert: ${alert.event}, ${sev.label} severity, ${alert.area || 'Unknown area'}`}
      >
        <div 
          className="primary-hero-bg-wrapper" 
          style={{ backgroundImage: `url('${bgImage}')` }}
        >
          <div className="primary-hero-gradient-overlay" />

          {/* Top Badges Row */}
          <div className="primary-hero-top-row">
            <div className="primary-badges-group">
              <span className="badge-extreme-primary" style={{ backgroundColor: sev.color }}>
                <span>{sev.icon}</span> {sev.label}
              </span>
              <span className="badge-imd-verified">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                VERIFIED IMD
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isLocal && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/80 text-white">
                  NEAR YOU
                </span>
              )}
              {isExpired && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  EXPIRED
                </span>
              )}
            </div>
          </div>

          {/* Alert Title & Location in Hero Image */}
          <div className="primary-hero-content">
            <h3 className="primary-event-heading">{alert.event}</h3>
            <div className="primary-location-row">
              <span>📍</span>
              <span className="truncate">{alert.area || 'Area not specified'}</span>
            </div>
          </div>
        </div>

        {/* Primary Description & Metadata Footer */}
        <div className="primary-info-footer">
          {alert.description && (
            <p className="primary-description-text">{alert.description}</p>
          )}

          <div className="primary-meta-action-row">
            <div className="meta-timestamps-group">
              <span>Issued {formatTimeAgo(alert.issuedAt)}</span>
              {alert.expiresAt && <span>•</span>}
              {alert.expiresAt && <span>Expires {formatTime(alert.expiresAt)}</span>}
            </div>

            <button className="action-cta-btn" tabIndex={-1}>
              <span>View Details</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </article>
    );
  }

  // ==========================================
  // 2. COMPACT SECONDARY ALERT CARD (2-Col Grid)
  // ==========================================
  return (
    <article
      className={`secondary-alert-card ${alert.severity?.toLowerCase() || 'moderate'} ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(alert)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(alert); } }}
      tabIndex={0}
      role="button"
      aria-label={`${alert.event}, ${sev.label} severity, ${alert.area || 'Unknown area'}`}
    >
      <div className="secondary-card-header">
        <span className={`secondary-severity-badge ${alert.severity?.toLowerCase() || 'moderate'}`}>
          <span>{sev.icon}</span> {sev.label}
        </span>

        <span className="badge-imd-verified" style={{ fontSize: '9px', padding: '2px 6px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          VERIFIED IMD
        </span>
      </div>

      <div className="secondary-card-body">
        <h4 className="secondary-event-title">{alert.event}</h4>
        <div className="secondary-location-text">
          <span>📍</span>
          <span className="truncate">{alert.area || 'Region unspecified'}</span>
          {isLocal && (
            <span className="text-[9px] font-bold text-blue-400 ml-1 uppercase">Local</span>
          )}
        </div>
        {alert.description && (
          <p className="secondary-description-snippet">{alert.description}</p>
        )}
      </div>

      <div className="secondary-card-footer">
        <div className="meta-timestamps-group">
          <span>Issued {formatTimeAgo(alert.issuedAt)}</span>
          {alert.expiresAt && <span>•</span>}
          {alert.expiresAt && <span>Expires {formatTime(alert.expiresAt)}</span>}
        </div>

        <button className="action-cta-btn" tabIndex={-1}>
          <span>View Details</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}