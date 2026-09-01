export function AlertSummaryCards({ summary }) {
  if (!summary || summary.total === 0) return null;

  return (
    <div className="severity-summary-bar" role="region" aria-label="Severity summary">
      {summary.extreme > 0 && (
        <span className="severity-pill-badge extreme">
          <span className="pill-dot" aria-hidden="true" />
          {summary.extreme} Extreme
        </span>
      )}
      {summary.severe > 0 && (
        <span className="severity-pill-badge severe">
          <span className="pill-dot" aria-hidden="true" />
          {summary.severe} Severe
        </span>
      )}
      {summary.moderate > 0 && (
        <span className="severity-pill-badge moderate">
          <span className="pill-dot" aria-hidden="true" />
          {summary.moderate} Moderate
        </span>
      )}
      {summary.minor > 0 && (
        <span className="severity-pill-badge minor">
          <span className="pill-dot" aria-hidden="true" />
          {summary.minor} Minor
        </span>
      )}
    </div>
  );
}