import { useState, useEffect, useCallback, useRef } from 'react';
import { performSync, loadCachedAlerts, getSyncInfo } from '../services/syncService.js';
import { fetchSummary } from '../services/alertApi.js';
export function useAlerts(networkState) {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ total: 0, extreme: 0, severe: 0, moderate: 0, minor: 0 });
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    loadFromCache();
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => {
    if (networkState.online && networkState.quality !== 'OFFLINE') {
      sync();
    }
  }, [networkState.online]);
  async function loadFromCache() {
    try {
      const cached = await loadCachedAlerts();
      const info = await getSyncInfo();
      if (mountedRef.current) {
        setAlerts(cached);
        setLastSync(info.lastSync);
        computeLocalSummary(cached);
      }
    } catch {
    }
  }
  const sync = useCallback(async () => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    setError(null);
    try {
      const result = await performSync(networkState.quality.toLowerCase());
      if (!mountedRef.current) return;
      if (result.updated) {
        const updated = await loadCachedAlerts();
        setAlerts(updated);
        computeLocalSummary(updated);
      }
      const info = await getSyncInfo();
      setLastSync(info.lastSync);
      try {
        const serverSummary = await fetchSummary();
        if (serverSummary && mountedRef.current) setSummary(serverSummary);
      } catch {
      }
      setSyncStatus('idle');
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
        setSyncStatus('error');
        setTimeout(() => { if (mountedRef.current) setSyncStatus('idle'); }, 5000);
      }
    }
  }, [syncStatus]);
  function computeLocalSummary(alertList) {
    const active = alertList.filter(a => a.status === 'ACTIVE');
    setSummary({
      total: active.length,
      extreme: active.filter(a => a.severity === 'Extreme').length,
      severe: active.filter(a => a.severity === 'Severe').length,
      moderate: active.filter(a => a.severity === 'Moderate').length,
      minor: active.filter(a => a.severity === 'Minor').length,
    });
  }
  return { alerts, summary, syncStatus, lastSync, error, sync };
}