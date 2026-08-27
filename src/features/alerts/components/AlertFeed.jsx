import { AlertCard } from './AlertCard.jsx';
export function AlertFeed({ alerts, selectedId, onSelect }) {
  if (!alerts.length) {
    return (
      <div className="feed-empty" role="status">
        <p>No active IMD alerts</p>
      </div>
    );
  }
  return (
    <div className="alert-feed" role="feed" aria-label="Weather alerts">
      {alerts.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          isSelected={selectedId === alert.id}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}