export function AlertSummaryCards({ summary }) {
  if (!summary || summary.total === 0) return null;

  return (
    <div className="weather-pulse" role="region" aria-label="Alert summary">
      {summary.extreme > 0 && (
        <div className="pulse-item" style={{ borderColor: 'var(--severity-extreme)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--severity-extreme)' }}>
          <span className="pulse-icon" aria-hidden="true">🔴</span>
          {summary.extreme} Extreme
        </div>
      )}
      {summary.severe > 0 && (
        <div className="pulse-item" style={{ borderColor: 'var(--severity-severe)', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--severity-severe)' }}>
          <span className="pulse-icon" aria-hidden="true">🟠</span>
          {summary.severe} Severe
        </div>
      )}
      {summary.moderate > 0 && (
        <div className="pulse-item" style={{ borderColor: 'var(--severity-moderate)', background: 'rgba(234, 179, 8, 0.1)', color: 'var(--severity-moderate)' }}>
          <span className="pulse-icon" aria-hidden="true">🟡</span>
          {summary.moderate} Moderate
        </div>
      )}
      {summary.minor > 0 && (
        <div className="pulse-item" style={{ borderColor: 'var(--severity-minor)', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--severity-minor)' }}>
          <span className="pulse-icon" aria-hidden="true">🔵</span>
          {summary.minor} Minor
        </div>
      )}
    </div>
  );
}