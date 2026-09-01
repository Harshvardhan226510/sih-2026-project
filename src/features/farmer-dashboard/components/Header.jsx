import React from 'react';
import { copy } from '../utils/i18n';

export function Header({ data, language, setLanguage, add, setAdd, search, setSearch }) {
  const text = copy[language];
  return (
    <header>
      <div>
        <p className="welcome">{text.welcome}</p>
        <h2>{data.farmer.name}</h2>
      </div>
      <div className="header-actions">
        <select
          className="language-select"
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            localStorage.setItem('weathergpt-language', e.target.value);
          }}
          aria-label="Choose language"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="mr">मराठी</option>
        </select>
        <button onClick={() => setAdd(!add)} aria-label="Add crop">＋</button>
        <button onClick={() => setSearch(!search)} aria-label="Change location">⌕</button>
        <button
          onClick={() => document.querySelector('.primary')?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="View advisory"
        >
          ♧
        </button>
      </div>
    </header>
  );
}
