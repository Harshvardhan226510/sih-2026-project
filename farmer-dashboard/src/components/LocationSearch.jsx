import React from 'react';
import { copy } from '../utils/i18n';

export function LocationSearch({ search, q, setQ, message, matches, choose, find, setSearch, language }) {
  if (!search) return null;
  const text = copy[language];
  return (
    <form className="location-search" onSubmit={find}>
      <label>{text.changeLocation}</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Village or district"
        autoFocus
      />
      <button>{text.search}</button>
      <button type="button" onClick={() => setSearch(false)}>{text.close}</button>
      <p>{message}</p>
      {matches.map((x) => (
        <button
          type="button"
          className="location-result"
          key={`${x.id}-${x.latitude}`}
          onClick={() => choose(x)}
        >
          {x.label}
        </button>
      ))}
    </form>
  );
}
