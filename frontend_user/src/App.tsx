import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextProvider } from '@shared/context/AuthContext';
import { ProtectedRoute } from '@shared/components/ProtectedRoute/ProtectedRoute';
import { LoginPage } from '@shared/components/Login/LoginPage';
import { useAuth } from '@shared/hooks/useAuth';
import { MonthHistory } from '@pages/MonthHistory';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/month-history" replace /> : <LoginPage appType="user" />} />
      <Route
        path="/month-history"
        element={
          <ProtectedRoute>
            <MonthHistory />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/month-history' : '/login'} replace />} />
    </Routes>
  );
};

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
