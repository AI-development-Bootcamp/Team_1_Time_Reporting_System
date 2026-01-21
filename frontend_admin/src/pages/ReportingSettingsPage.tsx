import { Container, Title, Text, Stack, Alert, Button, Skeleton, Paper, Box } from '@mantine/core';
import { useState, useMemo, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useReportingSettings } from '../hooks/useReportingSettings';
import { ReportingSettingsTable } from '../components/ReportingSettings/ReportingSettingsTable';
import { ReportingSettingsSearch } from '../components/ReportingSettings/ReportingSettingsSearch';
import { ReportingSettingsPagination } from '../components/ReportingSettings/ReportingSettingsPagination';
import { PAGINATION } from '../utils/constants';
import styles from './ReportingSettingsPage.module.css';

// Helper to check if we're in development mode (type-safe)
const isDev = (): boolean => {
  return (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false;
};

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
    if (isDev()) {
      console.log('Changing reporting type:', { projectId, reportingType });
    }
    
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
        onError: (error) => {
          notifications.show({
            title: 'שגיאה',
            message: 'אירעה שגיאה בעדכון סוג הדיווח',
            color: 'red',
          });
          if (isDev()) {
            console.error('Error updating reporting type:', error);
          }
        },
      }
    );
  };

  // Retry fetching projects
  const handleRetry = () => {
    refetch();
  };

  return (
    <Container 
      size="xl" 
      dir="rtl" 
      className={styles.container}
    >
      <Stack gap={8}>
        {/* Page Title and Search Bar Row */}
        <Box className={styles.titleRow}>
          <Box className={styles.titleColumn}>
            {/* Page Title */}
            <Title 
              order={2} 
              ta="right" 
              className={styles.pageTitle}
            >
              הגדרת דיווחי שעות
            </Title>
            
            {/* Page Subtitle */}
            <Text 
              c="dimmed" 
              size="sm" 
              ta="right" 
              className={styles.subtitle}
            >
              כאן תוכל להגדיר את סוג דיווחי השעות של העובדים בפרויקטים השונים.
            </Text>
          </Box>

          {/* Search Bar */}
          {!isLoading && !isError && (
            <Box className={styles.searchBox}>
              <ReportingSettingsSearch onSearchChange={setSearchValue} />
            </Box>
          )}
        </Box>

        {/* Loading State with Skeleton */}
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

        {/* Error State with Retry Button */}
        {isError && (
          <Alert title="שגיאה" color="red">
            <Stack gap="md">
              <Text>אירעה שגיאה בטעינת הפרויקטים. אנא נסה שוב.</Text>
              <Button onClick={handleRetry} variant="light" color="red">
                נסה שוב
              </Button>
            </Stack>
          </Alert>
        )}

        {/* Settings Table and Pagination Container */}
        {!isLoading && !isError && (
          <Stack gap={0} className={styles.contentStack}>
            <ReportingSettingsTable
              projects={paginatedProjects}
              onReportingTypeChange={handleReportingTypeChange}
              isUpdating={isUpdating}
            />
            
            {/* Pagination */}
            {filteredProjects.length > 0 && (
              <ReportingSettingsPagination
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
