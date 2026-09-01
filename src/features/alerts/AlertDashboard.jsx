import { useState, useEffect } from 'react';
import { useAlerts } from './hooks/useAlerts.js';
import { useNetwork } from './hooks/useNetwork.js';
import { useFilters, useSearch } from './hooks/useSearch.js';
import { AlertHeader } from './components/AlertHeader.jsx';
import { AlertSummaryCards } from './components/AlertSummaryCards.jsx';
import { AlertFilters } from './components/AlertFilters.jsx';
import { AlertSearch } from './components/AlertSearch.jsx';
import { AlertFeed } from './components/AlertFeed.jsx';
import { AlertDetail } from './components/AlertDetail.jsx';
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
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    getUserLocation().then(setLocation);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleLocationUpdated = (e) => {
      setLocation(e.detail);
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

  const localActiveCount = results.filter(a => a.status === 'ACTIVE' && location.district && a.area?.includes(location.district)).length;
  const activeAlertsCount = results.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="dashboard">
      <AlertHeader
        network={network}
        syncStatus={syncStatus}
        lastSync={lastSync}
        onSync={sync}
      />

      {error && (
        <div className="sync-error-banner" role="alert">
          <span>⚠️</span>
          <span>Sync issue: {error}. Showing cached meteorological alerts.</span>
        </div>
      )}

      <div className="dashboard-content-wrapper">
        <div className="dashboard-body">
          {/* Left Instrument Control Column */}
          <aside className="dashboard-sidebar">
            <LocationSettings location={location} onSave={handleSaveLocation} />
            <AlertSearch query={query} setQuery={setQuery} />
            <AlertFilters
              filters={filters}
              setFilters={setFilters}
              uniqueEvents={uniqueEvents}
              uniqueAreas={uniqueAreas}
            />
          </aside>

          {/* Right Primary Intelligence Workspace */}
          <main className="dashboard-main">
            {/* Section 8: Main Heading & Severity Summary */}
            <div className="workspace-header">
              <div className="workspace-title-row">
                <h2 className="workspace-title">Active Weather Alerts</h2>
                <span className="workspace-count-meta">
                  {localActiveCount > 0
                    ? `${localActiveCount} active near you • ${activeAlertsCount} in feed`
                    : `${activeAlertsCount} active alerts`}
                </span>
              </div>
              <AlertSummaryCards summary={summary} />
            </div>

            {/* Alert Feed (Single Primary Alert Hero + 2-Col Secondary Grid) */}
            <AlertFeed
              alerts={results}
              selectedId={selected?.id}
              onSelect={(alert) => {
                if (selected?.id === alert.id) {
                  setSelected(null);
                } else {
                  setSelected(alert);
                }
              }}
              location={location}
              loading={syncStatus === 'syncing' && alerts.length === 0}
            />
          </main>
        </div>
      </div>

      {/* Slide-in Detail Drawer */}
      {selected && (
        <AlertDetail
          alert={selected}
          onClose={() => setSelected(null)}
          networkOnline={network.online}
        />
      )}
    </div>
  );
}

export default AlertDashboard;