import { Container, Title, Text, Stack, Alert, Button, Skeleton, Paper } from '@mantine/core';
import { useState, useMemo, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useReportingSettings } from '../hooks/useReportingSettings';
import { ReportingSettingsTable } from '../components/ReportingSettings/ReportingSettingsTable';
import { ReportingSettingsSearch } from '../components/ReportingSettings/ReportingSettingsSearch';
import { ReportingSettingsPagination } from '../components/ReportingSettings/ReportingSettingsPagination';

function ReportingSettingsPage() {
  const { projects, isLoading, isError, updateReportingType, isUpdating, refetch } = useReportingSettings();
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;

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
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  // Slice data for current page
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue]);

  // Wrap mutation to match expected signature with notifications
  const handleReportingTypeChange = (projectId: number, reportingType: 'duration' | 'startEnd') => {
    console.log('Changing reporting type:', { projectId, reportingType });
    
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
          console.error('Error updating reporting type:', error);
        },
      }
    );
  };

  // Retry fetching projects
  const handleRetry = () => {
    refetch();
  };

  return (
    <Container size="xl" py="xl" dir="rtl">
      <Stack gap="md">
        {/* Page Title */}
        <Title order={1} ta="right">הגדרת דיווחי שעות</Title>
        
        {/* Page Subtitle */}
        <Text c="dimmed" size="sm" ta="right">
          כאן תוכל להגדיר את סוג דיווחי השעות של העובדים בפרויקטים השונים.
        </Text>

        {/* Search Bar */}
        {!isLoading && !isError && (
          <ReportingSettingsSearch onSearchChange={setSearchValue} />
        )}

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

        {/* Settings Table */}
        {!isLoading && !isError && (
          <>
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
          </>
        )}
      </Stack>
    </Container>
  );
}

export default ReportingSettingsPage;
