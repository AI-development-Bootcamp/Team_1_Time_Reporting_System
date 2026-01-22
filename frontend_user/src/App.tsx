/**
 * App Component - User Frontend
 * Combines authentication flow with month history UI
 */

import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Center, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AuthContextProvider } from '@shared/context/AuthContext';
import { ProtectedRoute } from '@shared/components/ProtectedRoute/ProtectedRoute';
import { LoginPage } from '@shared/components/Login/LoginPage';
import { useAuth } from '@shared/hooks/useAuth';
import { MonthHistoryPage } from '@components/MonthHistory';
import { BottomBar } from '@components/BottomBar';
import { ComingSoonModal } from '@components/ComingSoonModal';
import styles from './App.module.css';

/**
 * MonthHistoryView - Protected view that displays month history
 * Shows mobile warning if not on mobile device
 * Gets userId from auth context
 */
const MonthHistoryView = () => {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Modal state for "Coming Soon" feature
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Get user ID from auth context
  const userId = user?.id?.toString() || '';

  // Show message if not on mobile
  if (!isMobile) {
    return (
      <Center className={styles.mobileWarning}>
        <Stack align="center" gap="md">
          <Text size="xl" fw={600} ta="center" dir="rtl">
            הדף מותאם רק לפלאפון
          </Text>
          <Text size="md" c="dimmed" ta="center" dir="rtl">
            יש לעבור לפלאפון כדי להיות בדף זה
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <div className={styles.appContainer} dir="rtl">
      <MonthHistoryPage
        userId={userId}
        onEdit={(attendanceId) => {
          // TODO: Navigate to edit page
          console.log('Edit attendance:', attendanceId);
        }}
        onAddReport={(date) => {
          // TODO: Navigate to add report page
          console.log('Add report for date:', date);
        }}
      />
      <BottomBar onManualReport={openModal} />
      <ComingSoonModal opened={isModalOpen} onClose={closeModal} />
    </div>
  );
};

/**
 * AppRoutes - Define all routes with authentication
 */
const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show nothing while loading auth state
  if (isLoading) {
    return null;
  }

  return (
    <Routes>
      {/* Login page - redirect to month-history if already authenticated */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/month-history" replace />
          ) : (
            <LoginPage appType="user" />
          )
        }
      />

      {/* Month history - protected route */}
      <Route
        path="/month-history"
        element={
          <ProtectedRoute>
            <MonthHistoryView />
          </ProtectedRoute>
        }
      />

      {/* Default route - redirect based on auth status */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? '/month-history' : '/login'} replace />
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/**
 * App - Root component
 * Wraps the app with BrowserRouter and AuthContextProvider
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
