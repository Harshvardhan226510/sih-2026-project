export function AlertSearch({ query, setQuery }) {
  return (
    <div className="relative mb-4 w-full" role="search">
      <svg 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="search"
        className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all placeholder:text-slate-400"
        placeholder="Search alerts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search weather alerts"
      />
      {query && (
        <button 
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center transition-colors"
          onClick={() => setQuery('')}
          aria-label="Clear search"
          title="Clear search"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
}