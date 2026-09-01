import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, BarChart3, MessageSquare, Shield } from 'lucide-react';

export function TopNav() {
  const navLinks = [
    { to: '/alerts', label: 'Alerts Hub', icon: Bell },
    { to: '/research', label: 'Research & Analytics', icon: BarChart3 },
  ];

  return (
    <div className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-200 px-4 py-2 flex items-center justify-between z-40 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">WeatherGPT</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 hidden sm:inline-block">
            SIH 2026
          </span>
        </div>
      </div>

      <nav className="flex items-center space-x-1 sm:space-x-2">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default TopNav;
