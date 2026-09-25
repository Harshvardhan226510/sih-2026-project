import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './shared/components/MainLayout.jsx';
import { FarmerDashboard } from './features/farmer-dashboard/FarmerDashboard.jsx';
import ResearchDashboard from './features/research-analytics/ResearchDashboard.tsx';
import { AlertDashboard } from './features/alerts/AlertDashboard.jsx';
import AviationMarineDashboard from './features/aviation-marine/AviationMarineDashboard.jsx';
import GisMapView from './features/gis-map/GisMapView.jsx';
import Module1View from './features/chatbot/Module1View.jsx';
import { WeatherProvider } from './context/WeatherContext.jsx';
import './App.css';
import 'leaflet/dist/leaflet.css'; // Force global leaflet CSS

import { ChatbotView } from './features/chatbot/ChatbotView.jsx';

import { LandingPage } from './features/landing/LandingPage.jsx';

export function App() {
  return (
    <WeatherProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<MainLayout />}>
            <Route path="farmer" element={<FarmerDashboard />} />
            <Route path="aviation" element={<AviationMarineDashboard />} />
            <Route path="gis" element={<GisMapView />} />
            <Route path="research" element={<ResearchDashboard />} />
            <Route path="alerts" element={<AlertDashboard />} />
            <Route path="chatbot" element={<ChatbotView />} />
            <Route path="*" element={<Navigate to="/farmer" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WeatherProvider>
  );
}

export default App;
