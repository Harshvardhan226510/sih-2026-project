import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { useWeather } from '../../../context/WeatherContext';

export const LocationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { setSelectedLocation } = useWeather();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (text) => {
    setQuery(text);
    if (!text.trim() || text.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          text
        )}&count=6&language=en&format=json`
      );
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    setSelectedLocation({
      lat: item.latitude,
      lon: item.longitude,
      name: item.name,
      region: item.admin1 || item.country || 'India',
      country: item.country || 'India'
    });
    setQuery(item.name);
    setIsOpen(false);
  };

  return (
    <div className="location-search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search Indian city, district or village..."
          className="search-input"
        />
        {loading ? (
          <Loader2 className="spinner-icon animate-spin" size={18} />
        ) : query ? (
          <button className="clear-btn" onClick={() => setQuery('')}>
            <X size={16} />
          </button>
        ) : null}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="search-results-dropdown">
          {results.map((item) => (
            <li
              key={`${item.id}-${item.latitude}`}
              onClick={() => handleSelect(item)}
              className="search-result-item"
            >
              <MapPin size={16} className="pin-icon" />
              <div className="result-text">
                <span className="result-name">{item.name}</span>
                <span className="result-sub">
                  {[item.admin1, item.country].filter(Boolean).join(', ')}
                </span>
              </div>
              <span className="result-coords">
                {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
