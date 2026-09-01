import React from 'react';
import { Bot, Map, ShieldAlert, Sprout, Plane, BarChart3, CloudLightning, LogOut } from 'lucide-react';
import './SidebarNav.css';

export const SidebarNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'chatbot', label: 'WeatherGPT Chat', icon: Bot },
    { id: 'gis-map', label: 'GIS & Interactive Map', icon: Map },
    { id: 'alerts', label: 'Alerts & Warning', icon: ShieldAlert },
    { id: 'farmer-dashboard', label: 'Farmer Advisory', icon: Sprout },
    { id: 'aviation-marine', label: 'Aviation & Marine', icon: Plane },
    { id: 'research-analytics', label: 'Research Analytics', icon: BarChart3 }
  ];

  return (
    <aside className="app-vertical-sidebar">
      <div className="sidebar-brand-container">
        <div className="brand-logo-ring">
          <CloudLightning size={22} className="text-cyan-400" />
        </div>
      </div>

      <nav className="sidebar-nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <Icon size={20} className="nav-icon" />
              <span className="sidebar-tooltip">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom-action">
        <button className="sidebar-nav-btn logout" title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};
