import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './shared/components/MainLayout.jsx';
import { FarmerDashboard } from './features/farmer-dashboard/FarmerDashboard.jsx';
import ResearchDashboard from './features/research-analytics/ResearchDashboard.tsx';
import { AlertDashboard } from './features/alerts/AlertDashboard.jsx';
// Temporarily using div for placeholders
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full text-slate-500 bg-white">
    <h3 className="text-xl font-medium">{title}</h3>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/farmer" replace />} />
          <Route path="farmer" element={<FarmerDashboard />} />
          <Route path="aviation" element={<Placeholder title="Aviation-Marine Module Coming Soon..." />} />
          <Route path="gis" element={<Placeholder title="GIS Module Coming Soon..." />} />
          <Route path="research" element={<ResearchDashboard />} />
          <Route path="alerts" element={<AlertDashboard />} />
          <Route path="*" element={<Navigate to="/farmer" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


