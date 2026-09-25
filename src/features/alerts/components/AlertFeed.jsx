import { AlertCard } from './AlertCard.jsx';
import { useEffect, useState } from 'react';

const SEVERITY_WEIGHT = { EXTREME: 4, SEVERE: 3, MODERATE: 2, MINOR: 1, UNKNOWN: 0 };

export function AlertFeed({ alerts, selectedId, onSelect, location, loading }) {
  const [sortedAlerts, setSortedAlerts] = useState([]);

  useEffect(() => {
    // Alert Deep Linking (Hash handling)
    const handleHash = () => {
      const hash = window.location.hash.replace('#/alerts/', '');
      if (hash) {
        const found = alerts.find(a => a.id === hash);
        if (found) onSelect(found);
      }
    };
    handleHash();
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

      // 4. Newest update first
      return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
    });
    setSortedAlerts(sorted);
  }, [alerts, location]);

  if (loading) {
    return (
      <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-[2] pr-4">
                <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse"></div>
              </div>
              <div className="flex-[3] px-4">
                <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse"></div>
              </div>
              <div className="flex-[2] pl-4 flex flex-col items-end">
                <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sortedAlerts.length) {
    const locName = location?.district 
      ? `${location.district}, ${location.state}` 
      : location?.state || 'your region';

    return (
      <div className="feed-empty-calm" role="status">
        <div className="empty-state-icon-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <h3 className="empty-state-heading">ALL CLEAR</h3>
        <p className="empty-state-text">
          No active weather alerts for <strong>{locName}</strong>.
        </p>
        <span className="empty-state-timestamp">
          Continuous radar synchronization active • Checked just now
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" role="feed" aria-label="Weather alerts feed">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
        <div className="flex-[2]">Severity & Event</div>
        <div className="flex-[3]">Target Area</div>
        <div className="flex-[2] text-right">Validity Period</div>
      </div>
      <div className="divide-y divide-slate-100">
        {sortedAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            isSelected={selectedId === alert.id}
            onClick={onSelect}
            location={location}
          />
        ))}
      </div>
    </div>
  );
}