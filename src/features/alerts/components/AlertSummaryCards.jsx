export function AlertSummaryCards({ summary }) {
  if (!summary || summary.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3" role="region" aria-label="Severity summary">
      {summary.extreme > 0 && (
        <span className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-600" aria-hidden="true" />
          {summary.extreme} Extreme
        </span>
      )}
      {summary.severe > 0 && (
        <span className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
          <span className="w-2 h-2 rounded-full bg-orange-500" aria-hidden="true" />
          {summary.severe} Severe
        </span>
      )}
      {summary.moderate > 0 && (
        <span className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
          <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
          {summary.moderate} Moderate
        </span>
      )}
      {summary.minor > 0 && (
        <span className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
          {summary.minor} Minor
        </span>
      )}
    </div>
  );
}