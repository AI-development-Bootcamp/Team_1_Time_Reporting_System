import { useState, useCallback } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Center, Text, Stack } from '@mantine/core';
import { MonthHistoryPage } from './components/MonthHistory';
import { BottomBar } from './components/BottomBar';
import { ComingSoonModal } from './components/ComingSoonModal';
import styles from './App.module.css';

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
    <div className={styles.appContainer}>
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
