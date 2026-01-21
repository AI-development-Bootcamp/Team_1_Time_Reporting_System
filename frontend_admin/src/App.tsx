import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, DirectionProvider } from '@mantine/core';
import { AuthContextProvider } from '@shared/context/AuthContext';
import { ProtectedRoute } from '@shared/components/ProtectedRoute/ProtectedRoute';
import { LoginPage } from '@shared/components/Login/LoginPage';
import { useAuth } from '@shared/hooks/useAuth';
import { AppLayout } from '@components/Layout/AppLayout';
import { ClientManagement } from '@pages/ClientManagement';
import ReportingSettingsPage from '@pages/ReportingSettingsPage';
import { ErrorBoundary } from '@components/ErrorBoundary';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/client-management" replace /> : <LoginPage appType="admin" />} />

      <Route
        path="/client-management"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <ClientManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/client-management/reporting-setting"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <ReportingSettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={isAuthenticated ? '/client-management' : '/login'} replace />} />
    </Routes>
  );
};

/**
 * Root component that initializes application routing and authentication context.
 * Wraps the app's route tree with a router, RTL-configured MantineProvider, and the authentication provider.
 */
function App() {
  return (
    <DirectionProvider initialDirection="rtl">
      <MantineProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthContextProvider>
              <AppRoutes />
            </AuthContextProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </MantineProvider>
    </DirectionProvider>
  );
}

export default App;