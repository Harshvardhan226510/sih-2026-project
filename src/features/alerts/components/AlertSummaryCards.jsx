import { SEVERITY_CONFIG } from '../utils.js';
export function AlertSummaryCards({ summary }) {
  const cards = [
    { key: 'total', label: 'Active Alerts', count: summary.total, color: '#e5e7eb', icon: '📋' },
    { key: 'extreme', label: 'Extreme', count: summary.extreme, ...SEVERITY_CONFIG.Extreme },
    { key: 'severe', label: 'Severe', count: summary.severe, ...SEVERITY_CONFIG.Severe },
    { key: 'moderate', label: 'Moderate', count: summary.moderate, ...SEVERITY_CONFIG.Moderate },
    { key: 'minor', label: 'Minor', count: summary.minor, ...SEVERITY_CONFIG.Minor },
  ];
  return (
    <div className="summary-cards" role="region" aria-label="Alert summary">
      {cards.map(card => (
        <div key={card.key} className="summary-card" style={{ borderLeftColor: card.color }}>
          <span className="card-icon" aria-hidden="true">{card.icon}</span>
          <div className="card-content">
            <span className="card-count">{card.count}</span>
            <span className="card-label">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}