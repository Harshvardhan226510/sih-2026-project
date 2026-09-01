import { SEVERITY_CONFIG } from '../utils.js';

export function AlertFilters({ filters, setFilters, uniqueEvents, uniqueAreas }) {
  function update(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  function toggleSeverity(sev) {
    if (filters.severity === sev) {
      update('severity', '');
    } else {
      update('severity', sev);
    }
  }

  function clearAll() {
    setFilters({ severity: '', event: '', area: '', status: 'ACTIVE' });
  }

  const hasFilters = filters.severity || filters.event || filters.area || filters.status !== 'ACTIVE';

  return (
    <div className="sidebar-panel-card filter-section" role="region" aria-label="Alert filters">
      <div className="filter-group-header">
        <span>FILTERS</span>
        {hasFilters && (
          <button className="clear-filters-link" onClick={clearAll} type="button">
            Reset
          </button>
        )}
      </div>

      {/* Severity Filter */}
      <div className="filter-options-list">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Severity
        </div>
        {['Extreme', 'Severe', 'Moderate'].map((s) => {
          const isActive = filters.severity === s;
          const config = SEVERITY_CONFIG[s];
          return (
            <div
              key={s}
              className={`filter-checkbox-row ${isActive ? 'active' : ''}`}
              onClick={() => toggleSeverity(s)}
              role="checkbox"
              aria-checked={isActive}
            >
              <div className="filter-custom-radio" />
              <span className="flex items-center gap-1.5 flex-1">
                <span style={{ color: config?.color }}>{config?.icon}</span>
                <span>{s}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Source Filter */}
      <div className="filter-options-list">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Source
        </div>
        <div className="filter-checkbox-row active" style={{ cursor: 'default' }}>
          <div className="filter-custom-radio" />
          <span className="flex items-center gap-1.5 text-slate-200">
            <span>IMD Official</span>
          </span>
        </div>
      </div>

      {/* Area Filter */}
      {uniqueAreas && uniqueAreas.length > 0 && (
        <div className="filter-options-list">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Area / Region
          </div>
          <select 
            className="filter-select-instrument" 
            value={filters.area} 
            onChange={e => update('area', e.target.value)}
          >
            <option value="">All Regions ({uniqueAreas.length})</option>
            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {/* Status Filter */}
      <div className="filter-options-list">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Status
        </div>
        <select 
          className="filter-select-instrument"
          value={filters.status} 
          onChange={e => update('status', e.target.value)}
        >
          <option value="ACTIVE">Active Alerts Only</option>
          <option value="EXPIRED">Expired Alerts</option>
          <option value="">All Statuses</option>
        </select>
      </div>
    </div>
  );
}