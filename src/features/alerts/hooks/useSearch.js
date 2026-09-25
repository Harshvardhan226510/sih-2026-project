import { useState, useMemo } from 'react';
export function useSearch(alerts) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    if (!query.trim()) return alerts;
    const q = query.toLowerCase();
    return alerts.filter(a =>
      (a.area && a.area.toLowerCase().includes(q)) ||
      (a.areaCode && a.areaCode.toLowerCase().includes(q)) ||
      (a.event && a.event.toLowerCase().includes(q)) ||
      (a.type && a.type.toLowerCase().includes(q)) ||
      (a.headline && a.headline.toLowerCase().includes(q)) ||
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.source && a.source.toLowerCase().includes(q))
    );
  }, [alerts, query]);
  return { query, setQuery, results };
}
export function useFilters(alerts) {
  const [filters, setFilters] = useState({
    severity: '',
    event: '',
    area: '',
    status: '',
    time: '',
  });
  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (filters.severity && a.severity !== filters.severity) return false;
      
      const evt = a.type || a.event;
      if (filters.event && !evt?.toLowerCase().includes(filters.event.toLowerCase())) return false;
      
      if (filters.area && !a.area?.toLowerCase().includes(filters.area.toLowerCase()) && !a.areaCode?.toLowerCase().includes(filters.area.toLowerCase())) return false;
      if (filters.status && a.status !== filters.status) return false;

      if (filters.time) {
        const issuedTime = new Date(a.issued_at || a.issuedAt).getTime();
        const now = Date.now();
        if (filters.time === '24H' && (now - issuedTime) > 24 * 60 * 60 * 1000) return false;
        if (filters.time === '7D' && (now - issuedTime) > 7 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [alerts, filters]);
  const uniqueEvents = useMemo(() => [...new Set(alerts.map(a => a.type || a.event).filter(Boolean))].sort(), [alerts]);
  const uniqueAreas = useMemo(() => [...new Set(alerts.map(a => a.area).filter(Boolean))].sort(), [alerts]);
  return { filters, setFilters, filtered, uniqueEvents, uniqueAreas };
}