export function AlertSearch({ query, setQuery }) {
  return (
    <div className="search-container-instrument" role="search">
      <svg 
        className="search-icon-svg" 
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
        className="search-input-instrument"
        placeholder="Search alerts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search weather alerts"
      />
      {query && (
        <button 
          className="search-clear-btn" 
          onClick={() => setQuery('')}
          aria-label="Clear search query"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
}