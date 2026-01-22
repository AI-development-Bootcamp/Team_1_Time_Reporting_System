/**
 * MonthHistoryPage Component
 * Main page for displaying month history with attendance records
 */

import { useState, useCallback } from 'react';
import { Container, Loader, Center, Stack } from '@mantine/core';
import { useMonthHistory } from '../../hooks/useMonthHistory';
import { MonthHeader } from './MonthHeader';
import { MonthAccordion } from './MonthAccordion';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { DailyReportModal } from '../DailyReport';
import { BottomBar } from '../BottomBar';
import { getCurrentMonth, getCurrentYear, isFutureMonth, generateMonthDates, isCurrentMonth } from '../../utils/dateUtils';
import classes from './MonthHistoryPage.module.css';

interface MonthHistoryPageProps {
  /** User ID to fetch data for */
  userId: string;
}

export function MonthHistoryPage({ userId }: MonthHistoryPageProps) {
  // State for current month/year
  const [month, setMonth] = useState(getCurrentMonth());
  const [year] = useState(getCurrentYear()); // Year is fixed to current year (no year navigation)

  // Modal state
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editAttendanceId, setEditAttendanceId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Fetch month history data
  const { attendances, isLoading, isError, refetch } = useMonthHistory({
    month,
    year,
    userId,
    enabled: !isFutureMonth(month, year),
  });

  // Navigation handlers
  const handlePreviousMonth = useCallback(() => {
    if (month === 1) {
      // Can't go before January of current year
      return;
    }
    setMonth((prev) => prev - 1);
  }, [month]);

  const handleNextMonth = useCallback(() => {
    if (month === 12) {
      // Can't go after December of current year
      return;
    }
    setMonth((prev) => prev + 1);
  }, [month]);

  // Modal handlers
  const handleManualReportClick = useCallback(() => {
    // Open modal in create mode with today's date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    setModalMode('create');
    setEditAttendanceId(undefined);
    setSelectedDate(today);
    setIsDailyReportModalOpen(true);
  }, []);

  const handleAddReportClick = useCallback((date: string) => {
    // Open modal in create mode with specific date
    setModalMode('create');
    setEditAttendanceId(undefined);
    setSelectedDate(date);
    setIsDailyReportModalOpen(true);
  }, []);

  const handleEditClick = useCallback((attendanceId: string) => {
    // Open modal in edit mode with attendance ID
    setModalMode('edit');
    setEditAttendanceId(attendanceId);
    setSelectedDate(undefined);
    setIsDailyReportModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsDailyReportModalOpen(false);
    setModalMode('create');
    setEditAttendanceId(undefined);
    setSelectedDate(undefined);
  }, []);

  const handleModalSave = useCallback(() => {
    // Refresh month history after modal closes (assuming save was successful)
    refetch();
  }, [refetch]);

  // Check navigation disabled states
  const isPreviousDisabled = month === 1;
  const isNextDisabled = month === 12;

  // Check if future month
  const isFuture = isFutureMonth(month, year);

  // Check if month has no dates to show (shouldn't happen, but safety check)
  const isCurrent = isCurrentMonth(month, year);
  const dates = generateMonthDates(month, year, isCurrent);
  const hasNoDates = dates.length === 0 && !isFuture;

  // Check if there's no attendance data for a non-future month
  const hasNoData = !isFuture && !isLoading && !isError && attendances.length === 0 && !hasNoDates;

  return (
    <div className={classes.page}>
      {/* Header with month navigation */}
      <MonthHeader
        month={month}
        year={year}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        isPreviousDisabled={isPreviousDisabled}
        isNextDisabled={isNextDisabled}
      />

      {/* Main content area */}
      <Container size="xs" className={classes.content}>
        {/* Loading state */}
        {isLoading && (
          <Center className={classes.loaderContainer}>
            <Loader color="pink" size="lg" />
          </Center>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <ErrorState onRetry={refetch} />
        )}

        {/* Future month empty state */}
        {isFuture && !isLoading && !isError && (
          <EmptyState type="future" />
        )}

        {/* No data empty state (current or past month with no reports) */}
        {hasNoData && (
          <EmptyState type="noData" />
        )}

        {/* Data: Month accordion */}
        {!isLoading && !isError && !isFuture && !hasNoData && (
          <Stack gap={0} className={classes.accordionContainer}>
            <MonthAccordion
              month={month}
              year={year}
              attendances={attendances}
              onEdit={handleEditClick}
              onAddReport={handleAddReportClick}
            />
          </Stack>
        )}
      </Container>

      {/* Bottom Bar with Manual Report button */}
      <BottomBar onManualReport={handleManualReportClick} />

      {/* Daily Report Modal */}
      <DailyReportModal
        isOpen={isDailyReportModalOpen}
        onClose={() => {
          handleModalSave();
          handleModalClose();
        }}
        mode={modalMode}
        existingAttendanceId={editAttendanceId}
        defaultDate={selectedDate}
      />
    </div>
  );
}
