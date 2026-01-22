import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, DirectionProvider } from '@mantine/core';
import { AuthContextProvider } from '@shared/context/AuthContext';
import { ProtectedRoute } from '@shared/components/ProtectedRoute/ProtectedRoute';
import { LoginPage } from '@shared/components/Login/LoginPage';
import { useAuth } from '@shared/hooks/useAuth';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { AppLayout } from '@components/Layout/AppLayout';
import { ClientsPage } from '@pages/ClientsPage';
import ReportingSettingsPage from '@pages/ReportingSettingsPage';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login route - redirect to /client-management if already authenticated */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/client-management" replace /> : <LoginPage appType="admin" />} />

      {/* Protected admin routes */}
      <Route
        path="/client-management"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <ClientsPage />
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

      {/* Root route - redirect to /login if not authenticated, otherwise to /client-management */}
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