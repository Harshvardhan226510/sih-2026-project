import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertDashboard } from './features/alerts/AlertDashboard.jsx';
import { ResearchDashboard } from './features/research-analytics/ResearchDashboard.tsx';
import { TopNav } from './shared/components/TopNav.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <TopNav />
        <main className="flex-1">
          <Routes>
            <Route path="/alerts" element={<AlertDashboard />} />
            <Route path="/research" element={<ResearchDashboard />} />
            <Route path="/analytics" element={<Navigate to="/research" replace />} />
            <Route path="*" element={<Navigate to="/alerts" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;


