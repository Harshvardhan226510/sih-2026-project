import { AlertCard } from './AlertCard.jsx';
import { useEffect, useState } from 'react';

const SEVERITY_WEIGHT = { EXTREME: 4, SEVERE: 3, MODERATE: 2, MINOR: 1, UNKNOWN: 0 };

export function AlertFeed({ alerts, selectedId, onSelect, location }) {
  const [sortedAlerts, setSortedAlerts] = useState([]);

  useEffect(() => {
    // 27. Alert Deep Linking (Hash handling)
    const handleHash = () => {
      const hash = window.location.hash.replace('#/alerts/', '');
      if (hash) {
        const found = alerts.find(a => a.id === hash);
        if (found) onSelect(found);
      }
    };
    handleHash(); // initial check
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [alerts, onSelect]);

  useEffect(() => {
    const sorted = [...alerts].sort((a, b) => {
      // 1. Prioritize active over expired
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;

      // 2. Prioritize severity
      const wA = SEVERITY_WEIGHT[a.severity?.toUpperCase()] || 0;
      const wB = SEVERITY_WEIGHT[b.severity?.toUpperCase()] || 0;
      if (wA !== wB) return wB - wA;

      // 3. Location relevance (District match > State match)
      if (location) {
        const aDist = a.area?.includes(location.district);
        const bDist = b.area?.includes(location.district);
        if (aDist && !bDist) return -1;
        if (bDist && !aDist) return 1;
        
        const aState = a.area?.includes(location.state);
        const bState = b.area?.includes(location.state);
        if (aState && !bState) return -1;
        if (bState && !aState) return 1;
      }

      // 4. Newest update first (using issuedAt since updatedAt might be missing in compact payloads)
      return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
    });
    setSortedAlerts(sorted);
  }, [alerts, location]);

  if (!sortedAlerts.length) {
    return (
      <div className="feed-empty" role="status">
        <p>No active IMD alerts</p>
      </div>
    );
  }
  
  return (
    <div className="alert-feed" role="feed" aria-label="Weather alerts">
      {sortedAlerts.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          isSelected={selectedId === alert.id}
          onClick={onSelect}
          location={location}
        />
      ))}
    </div>
  );
}