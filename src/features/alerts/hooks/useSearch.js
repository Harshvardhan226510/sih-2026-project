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
      (a.headline && a.headline.toLowerCase().includes(q)) ||
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
    status: 'ACTIVE',
  });
  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (filters.severity && a.severity !== filters.severity) return false;
      if (filters.event && !a.event?.toLowerCase().includes(filters.event.toLowerCase())) return false;
      if (filters.area && !a.area?.toLowerCase().includes(filters.area.toLowerCase()) && !a.areaCode?.toLowerCase().includes(filters.area.toLowerCase())) return false;
      if (filters.status && a.status !== filters.status) return false;
      return true;
    });
  }, [alerts, filters]);
  const uniqueEvents = useMemo(() => [...new Set(alerts.map(a => a.event).filter(Boolean))].sort(), [alerts]);
  const uniqueAreas = useMemo(() => [...new Set(alerts.map(a => a.area).filter(Boolean))].sort(), [alerts]);
  return { filters, setFilters, filtered, uniqueEvents, uniqueAreas };
}