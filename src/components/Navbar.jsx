import React from 'react';
import { Map, Bot, ShieldAlert, Sprout, Plane, BarChart3, CloudLightning } from 'lucide-react';
import './Navbar.css';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'gis-map', label: 'GIS & Map', icon: Map },
    { id: 'chatbot', label: 'WeatherGPT Chat', icon: Bot },
    { id: 'alerts', label: 'Alerts & Warning', icon: ShieldAlert },
    { id: 'farmer-dashboard', label: 'Farmer Advisory', icon: Sprout },
    { id: 'aviation-marine', label: 'Aviation & Marine', icon: Plane },
    { id: 'research-analytics', label: 'Research Analytics', icon: BarChart3 }
  ];

  return (
    <header className="shared-navbar">
      <div className="nav-brand">
        <CloudLightning className="brand-logo" size={24} />
        <span className="brand-name">WeatherGPT</span>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
