import { useState } from 'react';
import { SEVERITY_CONFIG } from '../utils.js';

export function AlertFilters({ filters, setFilters, uniqueEvents, uniqueAreas }) {
  const [isOpen, setIsOpen] = useState(false);

  function update(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
  }
  function clearAll() {
    setFilters({ severity: '', event: '', area: '', status: 'ACTIVE' });
  }
  const hasFilters = filters.severity || filters.event || filters.area || filters.status !== 'ACTIVE';
  
  return (
    <div className="filters" role="search" aria-label="Alert filters">
      <button className="filters-toggle" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        Filters {hasFilters && <span style={{ color: 'var(--severity-minor)' }}>•</span>}
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {isOpen && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="filter-severity">Severity</label>
            <select id="filter-severity" value={filters.severity} onChange={e => update('severity', e.target.value)}>
              <option value="">All Severities</option>
              {Object.keys(SEVERITY_CONFIG).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-event">Event</label>
            <select id="filter-event" value={filters.event} onChange={e => update('event', e.target.value)}>
              <option value="">All Events</option>
              {uniqueEvents.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-area">Area</label>
            <select id="filter-area" value={filters.area} onChange={e => update('area', e.target.value)}>
              <option value="">All Areas</option>
              {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-status">Status</label>
            <select id="filter-status" value={filters.status} onChange={e => update('status', e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="">All Statuses</option>
            </select>
          </div>
          {hasFilters && (
            <button className="filter-clear" onClick={clearAll} type="button">Clear Filters</button>
          )}
        </div>
      )}
    </div>
  );
}