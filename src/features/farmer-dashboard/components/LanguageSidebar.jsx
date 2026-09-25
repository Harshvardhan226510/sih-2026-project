import React from 'react';

export function LanguageSidebar({ language, setLanguage }) {
  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
  ];

  return (
    <aside className="language-sidebar">
      <div className="language-sidebar-header">
        <h3>Language / भाषा</h3>
        <p>Select your preferred language</p>
      </div>
      <div className="language-options">
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`language-btn ${language === lang.code ? 'active' : ''}`}
            onClick={() => {
              setLanguage(lang.code);
              localStorage.setItem('weathergpt-language', lang.code);
            }}
          >
            <span className="lang-native">{lang.native}</span>
            <span className="lang-name">{lang.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
