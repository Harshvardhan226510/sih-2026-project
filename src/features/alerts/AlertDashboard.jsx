import { useState, useEffect } from 'react';
import { useNetwork } from './hooks/useNetwork.js';
import { useAlerts } from './hooks/useAlerts.js';
import { useSearch, useFilters } from './hooks/useSearch.js';
import { AlertHeader } from './components/AlertHeader.jsx';
import { AlertSummaryCards } from './components/AlertSummaryCards.jsx';
import { AlertFeed } from './components/AlertFeed.jsx';
import { AlertDetail } from './components/AlertDetail.jsx';
import { AlertFilters } from './components/AlertFilters.jsx';
import { AlertSearch } from './components/AlertSearch.jsx';
import { LocationSettings } from './components/LocationSettings.jsx';
import { getUserLocation, setUserLocation } from './services/alertDb.js';
import './AlertDashboard.css';

export function AlertDashboard() {
  const network = useNetwork();
  const { alerts, summary, syncStatus, lastSync, error, sync } = useAlerts(network);
  const { filters, setFilters, filtered, uniqueEvents, uniqueAreas } = useFilters(alerts);
  const { query, setQuery, results } = useSearch(filtered);
  const [selected, setSelected] = useState(null);
  
  const [location, setLocation] = useState({ state: '', district: '' });
  
  useEffect(() => {
    getUserLocation().then(setLocation);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleLocationUpdated = (e) => {
      setLocation(e.detail);
      // We don't necessarily need to trigger a full sync here because the location watcher 
      // already ensures the backend is aware of the new location. However, to get the new alerts:
      sync();
    };

    window.addEventListener('weathergpt:location-updated', handleLocationUpdated);
    return () => {
      window.removeEventListener('weathergpt:location-updated', handleLocationUpdated);
    };
  }, []);

  async function handleSaveLocation(newLocation) {
    await setUserLocation(newLocation.state, newLocation.district, newLocation);
    setLocation(newLocation);
    if (network.online && network.quality !== 'OFFLINE') {
      sync();
    }
  }
  return (
    <div className="dashboard">
      <AlertHeader
        network={network}
        syncStatus={syncStatus}
        lastSync={lastSync}
        onSync={sync}
      />
      {error && (
        <div className="sync-error" role="alert">
          Sync failed: {error}. Showing cached data.
        </div>
      )}
      <AlertSummaryCards summary={summary} />
      <div className="dashboard-body">
        <div className="dashboard-sidebar">
          <AlertSearch query={query} setQuery={setQuery} />
          <LocationSettings location={location} onSave={handleSaveLocation} />
          <AlertFilters
            filters={filters}
            setFilters={setFilters}
            uniqueEvents={uniqueEvents}
            uniqueAreas={uniqueAreas}
          />
        </div>
        <div className="dashboard-main">
          <div className="feed-header">
            <span className="feed-count">{results.length} alert{results.length !== 1 ? 's' : ''}</span>
          </div>
          <AlertFeed
            alerts={results}
            selectedId={selected?.id}
            onSelect={setSelected}
          />
        </div>
        {selected && (
          <AlertDetail
            alert={selected}
            onClose={() => setSelected(null)}
            networkOnline={network.online}
          />
        )}
      </div>
    </div>
  );
}