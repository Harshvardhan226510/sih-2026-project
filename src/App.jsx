import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertDashboard } from './features/alerts/AlertDashboard.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/alerts" element={<AlertDashboard />} />
        <Route path="*" element={<Navigate to="/alerts" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
