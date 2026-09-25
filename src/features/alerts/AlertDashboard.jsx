import { useState, useEffect } from 'react';
import { supabase } from '../../shared/lib/supabaseClient.js';
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
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ total: 0, extreme: 0, severe: 0, moderate: 0, minor: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    async function fetchAlerts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('issued_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        setError(error.message);
      } else {
        setAlerts(data || []);
        computeSummary(data || []);
      }
      setLoading(false);
    }
    fetchAlerts();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('public:alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        console.log('Real-time alert update:', payload);
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function computeSummary(alertList) {
    // Assuming active if status is not EXPIRED or if we just count all returned
    const active = alertList.filter(a => a.status !== 'EXPIRED');
    setSummary({
      total: active.length,
      extreme: active.filter(a => a.severity === 'Extreme').length,
      severe: active.filter(a => a.severity === 'Severe').length,
      moderate: active.filter(a => a.severity === 'Moderate').length,
      minor: active.filter(a => a.severity === 'Minor').length,
    });
  }

  async function handleSaveLocation(newLocation) {
    await setUserLocation(newLocation.state, newLocation.district, newLocation);
    setLocation(newLocation);
  }

  const localActiveCount = results.filter(a => a.status === 'ACTIVE' && location.district && a.area?.includes(location.district)).length;
  const activeAlertsCount = results.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="flex-1 w-full h-full min-h-0 bg-slate-50 flex flex-col font-sans text-slate-800">

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 flex items-center text-sm font-medium border-b border-red-200" role="alert">
          <span className="mr-2">⚠️</span>
          <span>Sync issue: {error}. Showing cached meteorological alerts.</span>
        </div>
      )}

      {/* Full-width flex layout like GIS and Aviation modules */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* LEFT SIDEBAR */}
        <aside className="w-72 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col gap-0 overflow-y-auto">
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