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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-5" role="region" aria-label="Alert filters">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
        <span>FILTERS</span>
      </div>

      {/* Severity Filter */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Severity
        </div>
        {['Extreme', 'Severe', 'Moderate'].map((s) => {
          const isActive = filters.severity === s;
          const config = SEVERITY_CONFIG[s];
          return (
            <div
              key={s}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              onClick={() => toggleSeverity(s)}
              role="checkbox"
              aria-checked={isActive}
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                {isActive && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span className="flex items-center gap-1.5 flex-1">
                <span style={{ color: config?.color }}>{config?.icon}</span>
                <span>{s}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Source Filter */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Source
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 text-slate-400 text-sm font-medium cursor-not-allowed">
          <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-200 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span className="flex items-center gap-1.5">
            <span>IMD Official</span>
          </span>
        </div>
      </div>

      {/* Area Filter */}
      {uniqueAreas && uniqueAreas.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Area / Region
          </div>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none appearance-none cursor-pointer" 
            value={filters.area} 
            onChange={e => update('area', e.target.value)}
          >
            <option value="">All Regions ({uniqueAreas.length})</option>
            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Status
        </div>
        <select 
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none appearance-none cursor-pointer"
          value={filters.status} 
          onChange={e => update('status', e.target.value)}
        >
          <option value="ACTIVE">Active Alerts Only</option>
          <option value="EXPIRED">Expired Alerts</option>
          <option value="ALL">All Statuses</option>
        </select>
      </div>

      {/* Time Filter */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Recency
        </div>
        <select 
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none appearance-none cursor-pointer"
          value={filters.time} 
          onChange={e => update('time', e.target.value)}
        >
          <option value="">All Time</option>
          <option value="24H">Last 24 Hours</option>
          <option value="7D">Last 7 Days</option>
        </select>
      </div>
    </div>
  );
}