import { Container, Title, Text, Stack, Alert, Button, Skeleton, Paper, Box, TextInput, Group } from '@mantine/core';
import { useState, useMemo, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import { useReportingSettings } from '../hooks/useReportingSettings';
import { ReportingSettingsTable } from '../components/ReportingSettings/ReportingSettingsTable';
import { ReusablePagination } from '../components/Common/ReusablePagination';
import { PAGINATION } from '../utils/constants';
import styles from './ReportingSettingsPage.module.css';
import searchStyles from '../styles/components/ClientsTable.module.css';

function ReportingSettingsPage() {
  const { projects, isLoading, isError, updateReportingType, isUpdating, refetch } = useReportingSettings();
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter projects by client name OR project name (case-insensitive)
  const filteredProjects = useMemo(() => {
    if (!searchValue.trim()) {
      return projects;
    }

    const searchLower = searchValue.toLowerCase().trim();
    return projects.filter((project) => {
      const clientNameMatch = project.client.name.toLowerCase().includes(searchLower);
      const projectNameMatch = project.name.toLowerCase().includes(searchLower);
      return clientNameMatch || projectNameMatch;
    });
  }, [projects, searchValue]);

  // Calculate total pages from filtered results
  const totalPages = Math.ceil(filteredProjects.length / PAGINATION.ITEMS_PER_PAGE);

  // Slice data for current page
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGINATION.ITEMS_PER_PAGE;
    const endIndex = startIndex + PAGINATION.ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  // Wrap mutation to match expected signature with notifications
  const handleReportingTypeChange = (projectId: number, reportingType: 'duration' | 'startEnd') => {
    updateReportingType(
      { projectId, reportingType },
      {
        onSuccess: () => {
          notifications.show({
            title: 'הצלחה',
            message: 'סוג הדיווח עודכן בהצלחה',
            color: 'green',
          });
        },
        onError: () => {
          notifications.show({
            title: 'שגיאה',
            message: 'אירעה שגיאה בעדכון סוג הדיווח',
            color: 'red',
          });
        },
      }
    );
  };

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
              הגדרת דיווחי שעות
            </Title>
            <Text 
              c="dimmed" 
              size="sm" 
              ta="right" 
              className={styles.subtitle}
            >
              כאן תוכל להגדיר את סוג דיווחי השעות של העובדים בפרויקטים השונים.
            </Text>
          </Box>
          {!isLoading && !isError && (
          <Group justify="flex-end" gap="md" mb="md">
            <TextInput
              placeholder="חיפוש לפי שם לקוח/פרויקט"
              value={searchValue}
              onChange={(e) => setSearchValue(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              className={searchStyles.searchInput}
            />
          </Group>
          )}
        {isLoading && (
          <Stack gap="md">
            <Skeleton height={40} radius="sm" />
            <Paper shadow="xs" p="md" withBorder>
              <Stack gap="md">
                <Skeleton height={30} width="100%" />
                <Skeleton height={50} width="100%" />
                <Skeleton height={50} width="100%" />
                <Skeleton height={50} width="100%" />
                <Skeleton height={50} width="100%" />
              </Stack>
            </Paper>
          </Stack>
        )}
        {isError && (
          <Alert title="שגיאה" color="red">
            <Stack gap="md">
              <Text>אירעה שגיאה בטעינת הפרויקטים. אנא נסה שוב.</Text>
              <Button onClick={() => refetch()} variant="light" color="red">
                נסה שוב
              </Button>
            </Stack>
          </Alert>
        )}
        {!isLoading && !isError && (
          <Stack gap={0} className={styles.contentStack}>
            <ReportingSettingsTable
              projects={paginatedProjects}
              onReportingTypeChange={handleReportingTypeChange}
              isUpdating={isUpdating}
            />
            {filteredProjects.length > 0 && (
              <ReusablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

export default ReportingSettingsPage;
