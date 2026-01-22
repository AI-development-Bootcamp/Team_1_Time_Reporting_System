import { useMediaQuery } from '@mantine/hooks';
import { Center, Text, Stack } from '@mantine/core';
import { MonthHistoryPage } from './components/MonthHistory';
import styles from './App.module.css';

function App() {
  // Check if mobile view (max-width: 768px)
  const isMobile = useMediaQuery('(max-width: 768px)');

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
      <MonthHistoryPage userId={userId} />
    </div>
  );
}

export default App;
