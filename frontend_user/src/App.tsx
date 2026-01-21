import { useState, useCallback } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Center, Text, Stack } from '@mantine/core';
import { MonthHistoryPage } from './components/MonthHistory';
import { BottomBar } from './components/BottomBar';
import { ComingSoonModal } from './components/ComingSoonModal';

/**
 * Root React component that renders a mobile-first application layout and coordinates the Coming Soon modal.
 *
 * Renders a centered informational message on non-mobile viewports. On mobile viewports it renders the mobile
 * container with MonthHistoryPage, BottomBar, and ComingSoonModal, and manages modal open/close state passed to
 * child components. Uses a placeholder `userId` until an auth context is integrated.
 *
 * @returns The React element tree for the app's current viewport (non-mobile message or mobile layout).
 */
function App() {
  // Check if mobile view (max-width: 768px)
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open coming soon modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // TODO: Get actual userId from auth context
  const userId = '85';

  // Show message if not on mobile
  if (!isMobile) {
    return (
      <Center style={{ height: '100vh', padding: '20px' }}>
        <Stack align="center" gap="md">
          <Text size="xl" fw={600} ta="center" dir="rtl">
            הדף מותאם רק לפלאפון
          </Text>
          <Text size="md" c="dimmed" ta="center" dir="rtl">
            יש לעבור לפאלפון כדי להיות בדף זה
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <div style={{ 
      overflow: 'hidden',
      maxWidth: '100vw',
      minHeight: '100vh'
    }}>
      <MonthHistoryPage
        userId={userId}
        onEdit={openModal}
        onAddReport={openModal}
      />
      <BottomBar onManualReport={openModal} />
      <ComingSoonModal opened={isModalOpen} onClose={closeModal} />
    </div>
  );
}

export default App;