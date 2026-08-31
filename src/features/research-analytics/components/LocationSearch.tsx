import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';

export interface LocationData {
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  type?: string;
}

interface Props {
  selectedLocation: string | LocationData;
  onLocationChange: (loc: LocationData) => void;
}

interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  admin2?: string;
  feature_code?: string;
}

export const LocationSearch: React.FC<Props> = ({ selectedLocation, onLocationChange }) => {
  const [query, setQuery] = useState(
    typeof selectedLocation === 'string' ? selectedLocation : selectedLocation.name
  );
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce query
  useEffect(() => {
    if (!query || query.length < 2 || !open) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=en&format=json`);
        if (res.ok) {
          const data = await res.json();
          const indianResults = (data.results || []).filter(
            (r: any) => r.country_code === 'IN' || r.country === 'India'
          );
          setResults(indianResults.slice(0, 5));
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Geocoding failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync prop changes
  useEffect(() => {
    if (typeof selectedLocation === 'string') {
      setQuery(selectedLocation);
    } else {
      setQuery(selectedLocation.name);
    }
  }, [selectedLocation]);

  const handleSelect = (result: GeocodeResult) => {
    setQuery(result.name);
    setOpen(false);
    onLocationChange({
      name: result.name,
      state: result.admin1 || result.admin2 || 'Unknown Region',
      country: result.country || 'Unknown Country',
      lat: result.latitude,
      lon: result.longitude,
      type: result.feature_code
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setResults([]);
    setOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Search an Indian city, town, district or state..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-4 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {results.map((res) => (
                <li
                  key={res.id}
                  onClick={() => handleSelect(res)}
                  className="px-4 py-2 hover:bg-slate-800 cursor-pointer flex flex-col border-b border-slate-800/50 last:border-0"
                >
                  <div className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                    <span className="truncate">{res.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 pl-5 truncate">
                    {[res.admin1, res.admin2, res.country].filter(Boolean).join(', ')}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
