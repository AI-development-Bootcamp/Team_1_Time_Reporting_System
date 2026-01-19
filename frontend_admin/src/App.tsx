import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import ReportingSettingsPage from './pages/ReportingSettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<div><h1>מערכת דיווח שעות - ניהול</h1></div>} />
          <Route path="/client-management/reporting-setting" element={<ReportingSettingsPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
