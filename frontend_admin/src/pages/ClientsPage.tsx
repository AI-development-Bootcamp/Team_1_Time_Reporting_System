import { Container, Title, Text, Box, Stack } from '@mantine/core';
import { ClientsTable } from '../components/Clients/ClientsTable';
import styles from './ClientsPage.module.css';

export function ClientsPage() {
  return (
    <Container 
      size="xl" 
      dir="rtl" 
      className={styles.container}
    >
      <Stack gap={8}>
        <Box className={styles.titleColumn}>
          <Title 
            order={2} 
            ta="right" 
            className={styles.pageTitle}
          >
            שיוך עובד למשימה
          </Title>
          <Text 
            c="dimmed" 
            size="sm" 
            ta="right" 
            className={styles.subtitle}
          >
            כאן תוכל לשייך עובדים למשימות מתוך פרויקטים שונים של לקוחות.
          </Text>
        </Box>
        <ClientsTable />
      </Stack>
    </Container>
  );
}

