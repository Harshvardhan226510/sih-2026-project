export function AlertHeader({ syncStatus }) {
  const isSyncing = syncStatus === 'syncing';
  
  return (
    <header className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200 flex justify-between items-center z-10 sticky top-0" role="banner">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h1 id="dashboard-title" className="text-2xl font-bold text-slate-800 m-0">Weather AI</h1>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Official Alerts Feed</span>
        </div>
        <div className="text-sm text-slate-500 hidden sm:block mt-1">
          Meteorological alert intelligence & early warning
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold bg-green-50 text-green-700 border-green-200" role="status" aria-live="polite">
          <span className={`w-2 h-2 rounded-full bg-green-500 ${isSyncing ? 'animate-pulse' : ''}`} aria-hidden="true" />
          <span>{isSyncing ? 'Loading…' : 'Live: Official Data'}</span>
        </div>
      </div>
    </header>
  );
}