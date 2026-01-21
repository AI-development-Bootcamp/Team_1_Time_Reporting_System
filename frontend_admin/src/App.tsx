import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { AppLayout } from '@components/Layout/AppLayout';
import ReportingSettingsPage from '@pages/ReportingSettingsPage';
import { ClientsPage } from '@pages/ClientsPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Redirect root to client management */}
            <Route path="/" element={<Navigate to="/client-management" replace />} />
            {/* Client / Project / Task management table */}
            <Route path="/client-management" element={<ClientsPage />} />
            {/* Reporting settings */}
            <Route
              path="/client-management/reporting-setting"
              element={<ReportingSettingsPage />}
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
