import React, { useState } from 'react';
import { Menu, HelpCircle, UserCircle, Hexagon, MessageCircle } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const copilotModes = [
  { id: 'chatbot', label: 'Chatbot', path: '/chatbot' },
  { id: 'farmer', label: 'Farmer', path: '/farmer' },
  { id: 'aviation-marine', label: 'Aviation-Marine', path: '/aviation' },
  { id: 'gis', label: 'GIS', path: '/gis' },
  { id: 'research-analytics', label: 'Research Analytics', path: '/research' },
  { id: 'alerts', label: 'Alerts', path: '/alerts' },
];

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative overflow-hidden">
      {/* Top Navbar */}
      <header className="shrink-0 sticky top-0 h-[64px] border-b border-gray-200 px-4 py-3 flex items-center justify-center bg-white z-50 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Logo icon */}
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
             <Hexagon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">WeatherGPT</span>
        </div>
      </header>

      {/* Copilot Modes Bar */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-center gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap shadow-sm z-40 w-full">
        <span className="text-gray-500 font-semibold tracking-wide uppercase text-xs hidden sm:block">Modules</span>
        <div className="flex gap-2 sm:gap-3">
          {copilotModes.map(mode => (
            <NavLink
              key={mode.id}
              to={mode.path}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full border transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105 font-semibold tracking-wide' 
                    : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50 hover:text-blue-700 hover:border-blue-300'
                }`
              }
            >
              {mode.label}
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50 p-4">
        <div className="w-full flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden shadow-lg relative">
          <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col w-full">
             <Outlet />
          </div>
        </div>
      </main>

      {/* Floating Chatbot Button (Hidden if already on chatbot page) */}
      {location.pathname !== '/chatbot' && (
        <button 
          onClick={() => navigate('/chatbot')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50 border border-blue-400 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
          {/* Optional Ping effect */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border border-white"></span>
          </span>
        </button>
      )}
    </div>
  );
}
