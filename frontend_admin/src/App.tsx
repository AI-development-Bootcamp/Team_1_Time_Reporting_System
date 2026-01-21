import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextProvider } from '@shared/context/AuthContext';
import { ProtectedRoute } from '@shared/components/ProtectedRoute/ProtectedRoute';
import { LoginPage } from '@shared/components/Login/LoginPage';
import { useAuth } from '@shared/hooks/useAuth';
import { ClientManagement } from '@pages/ClientManagement';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/client-management" replace /> : <LoginPage appType="admin" />} />
      <Route
        path="/client-management"
        element={
          <ProtectedRoute requireAdmin>
            <ClientManagement />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/client-management' : '/login'} replace />} />
    </Routes>
  );
};

/**
 * Root component that initializes application routing and authentication context.
 *
 * Wraps the app's route tree with a router and the authentication provider.
 *
 * @returns The root JSX element containing the BrowserRouter, AuthContextProvider, and AppRoutes
 */
function App() {
  return (
    <BrowserRouter>
      <AuthContextProvider>
        <AppRoutes />
      </AuthContextProvider>
    </BrowserRouter>
  );
}

export default App;