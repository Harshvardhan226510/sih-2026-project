import React, { useState } from 'react';
import { Menu, HelpCircle, UserCircle, Hexagon } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Module1View from '../../features/chatbot/Module1View.jsx';

const copilotModes = [
  { id: 'farmer', label: 'Farmer', path: '/farmer' },
  { id: 'aviation-marine', label: 'Aviation-Marine', path: '/aviation' },
  { id: 'gis', label: 'GIS', path: '/gis' },
  { id: 'research-analytics', label: 'Research Analytics', path: '/research' },
  { id: 'alerts', label: 'Alerts', path: '/alerts' },
];

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-white z-40">
        <button className="text-gray-500 hover:text-gray-800 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Logo icon */}
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-gray-300">
             <Hexagon className="w-5 h-5 text-slate-700" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">WeatherGPT</span>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-gray-600 transition-colors">
            <HelpCircle className="w-6 h-6" />
          </button>
          <button className="hover:text-gray-600 transition-colors">
            <UserCircle className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Copilot Modes Bar */}
      <div className="bg-gray-50/80 border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-sm font-medium overflow-x-auto whitespace-nowrap">
        <span className="text-gray-600 font-semibold ml-4">Copilot Modes:</span>
        <div className="flex gap-2">
          {copilotModes.map(mode => (
            <NavLink
              key={mode.id}
              to={mode.path}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded border transition-colors ${
                  isActive 
                    ? 'bg-teal-600 text-white border-teal-700 shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                }`
              }
            >
              {mode.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-100 p-3 gap-3">
        {/* Left Pane - Chatbot */}
        <div className="w-full md:w-1/2 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
          <div className="flex-1 overflow-hidden relative">
            <ChatbotContainer />
          </div>
        </div>

        {/* Right Pane - Dynamic Module Data */}
        <div className="w-full md:w-1/2 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">
              {location.pathname.includes('/farmer') && 'Farmer Dashboard: Crop Advisories & Weather'}
              {location.pathname.includes('/research') && 'Research Analytics: Historical Data & Trends'}
              {location.pathname.includes('/alerts') && 'Alerts Hub: Real-time Weather Warnings'}
              {location.pathname.includes('/gis') && 'GIS Map: Localized Rainfall Analysis'}
              {location.pathname.includes('/aviation') && 'Aviation & Marine: Specialized Forecasts'}
            </h2>
          </div>
          <div className="flex-1 overflow-auto relative bg-slate-900">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

// Wrapper for the Chatbot Module to ensure it fills the pane properly
function ChatbotContainer() {
  return (
    <div className="w-full h-full flex flex-col">
       <Module1View />
    </div>
  );
}
