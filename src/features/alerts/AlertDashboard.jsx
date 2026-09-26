import { useState, useEffect } from 'react';
import { useAlerts } from './hooks/useAlerts.js';
import { useNetwork } from './hooks/useNetwork.js';
import { useFilters, useSearch } from './hooks/useSearch.js';
import { AlertSummaryCards } from './components/AlertSummaryCards.jsx';
import { AlertFilters } from './components/AlertFilters.jsx';
import { AlertSearch } from './components/AlertSearch.jsx';
import { AlertFeed } from './components/AlertFeed.jsx';
import { AlertDetail } from './components/AlertDetail.jsx';
import { LocationSettings } from './components/LocationSettings.jsx';
import { getUserLocation, setUserLocation } from './services/alertDb.js';

export function AlertDashboard() {
  const network = useNetwork();
  const { alerts, summary, syncStatus, error } = useAlerts(network);
  const loading = syncStatus === 'syncing';

  const { filters, setFilters, filtered, uniqueEvents, uniqueAreas } = useFilters(alerts);
  const { query, setQuery, results } = useSearch(filtered);
  const [selected, setSelected] = useState(null);
  const [location, setLocation] = useState({ state: '', district: '' });

  useEffect(() => {
    // Removed forced dark theme to sync with global layout
  }, []);

  useEffect(() => {
    getUserLocation().then(setLocation);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleLocationUpdated = (e) => {
      setLocation(e.detail);
    };

    window.addEventListener('weathergpt:location-updated', handleLocationUpdated);
    return () => {
      window.removeEventListener('weathergpt:location-updated', handleLocationUpdated);
    };
  }, []);



  async function handleSaveLocation(newLocation) {
    await setUserLocation(newLocation.state, newLocation.district, newLocation);
    setLocation(newLocation);
  }

  const localActiveCount = results.filter(a => a.status === 'ACTIVE' && location.district && a.area?.includes(location.district)).length;
  const activeAlertsCount = results.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="flex-1 w-full h-full min-h-0 bg-slate-50 flex flex-col font-sans text-slate-800">

      {/* Sync Status Banner */}
      <div className={`px-4 py-2 flex items-center text-sm font-medium border-b ${
        !network.online ? 'bg-amber-50 text-amber-700 border-amber-200' :
        error ? 'bg-red-50 text-red-600 border-red-200' :
        syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
        'bg-green-50 text-green-700 border-green-200'
      }`}>
        <span className="mr-2">
          {!network.online ? '📡' : error ? '⚠️' : syncStatus === 'syncing' ? '🔄' : '✅'}
        </span>
        <span>
          {!network.online ? 'Offline - Showing cached alerts.' :
           error ? `Sync issue: ${error}. Showing cached meteorological alerts.` :
           syncStatus === 'syncing' ? 'Synchronizing with shared Alerts backend...' :
           'Live / Synchronized with authoritative backend.'}
        </span>
      </div>

      {/* Full-width flex layout like GIS and Aviation modules */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col gap-0 overflow-y-auto justify-between">
          <div className="p-4 flex flex-col gap-4">
            <LocationSettings location={location} onSave={handleSaveLocation} />
            <AlertSearch query={query} setQuery={setQuery} />
            <AlertFilters
              filters={filters}
              setFilters={setFilters}
              uniqueEvents={uniqueEvents}
              uniqueAreas={uniqueAreas}
            />
          </div>
          
          {/* Debugging Information */}
          <div className="p-4 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 font-mono">
            <div>API: {import.meta.env.VITE_ALERTS_API_URL || '/api'}</div>
            <div>Sync: {syncStatus}</div>
            <div>Last: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Never'}</div>
            <div>Network: {network.online ? 'Online' : 'Offline'} ({network.quality})</div>
            <div>Alerts: {alerts.length} local</div>
          </div>
        </aside>

        {/* RIGHT PRIMARY CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col h-full bg-slate-50/30 overflow-hidden relative">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 z-10">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-900">Active Weather Alerts</h2>
              <span className="text-sm text-slate-500 font-medium">
                {localActiveCount > 0
                  ? `${localActiveCount} active near you • ${activeAlertsCount} in feed`
                  : `${activeAlertsCount} active alerts`}
              </span>
            </div>
            <AlertSummaryCards summary={summary} />
          </div>

          {/* Alert Feed Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-6">
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
              loading={loading}
            />
          </div>
        </main>
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