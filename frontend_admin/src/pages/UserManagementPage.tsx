import { Container, Title, Text, Box, Stack } from '@mantine/core';
import { UsersTable } from '../components/Users/UsersTable';
import styles from './UserManagementPage.module.css';

export function UserManagementPage() {
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
                        יצירת/שינוי משתמש
                    </Title>
                    <Text
                        c="dimmed"
                        size="sm"
                        ta="right"
                        className={styles.subtitle}
                    >
                        כאן תוכל לנהל משתמשים במערכת - ליצור, לערוך, למחוק ולאפס סיסמאות.
                    </Text>
                </Box>
                <UsersTable />
            </Stack>
        </Container>
    );
}
