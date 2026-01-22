/**
 * DailyReportModal Component
 * Full-screen modal for creating/editing daily attendance reports
 * 
 * Features:
 * - Mobile-first, RTL design
 * - Two tabs: Work Report / Absence Report
 * - Full-screen modal with header
 * - Edit mode: Fetches and pre-fills existing data
 */

import { useState, useEffect } from 'react';
import { Modal, Tabs, CloseButton, Text, Stack, Center, Loader } from '@mantine/core';
import { useAttendance } from '../../hooks';
import { DailyReportTab } from '../../types/dailyReport';
import { WorkReportTab } from './WorkReportTab';
import classes from './DailyReportModal.module.css';

interface DailyReportModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Mode: create new report or edit existing */
  mode?: 'create' | 'edit';
  /** Existing attendance ID (for edit mode) */
  existingAttendanceId?: string;
  /** Default date to pre-fill (YYYY-MM-DD) */
  defaultDate?: string;
}

/**
 * DailyReportModal - Main modal for daily attendance reporting
 * 
 * @example
 * <DailyReportModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   mode="create"
 *   defaultDate="2026-01-21"
 * />
 */
export function DailyReportModal({
  isOpen,
  onClose,
  mode = 'create',
  existingAttendanceId,
  defaultDate,
}: DailyReportModalProps) {
  const [activeTab, setActiveTab] = useState<DailyReportTab>('work');

  // Fetch attendance data in edit mode
  const { attendance, isLoading: isLoadingAttendance } = useAttendance({
    attendanceId: existingAttendanceId,
    enabled: mode === 'edit' && !!existingAttendanceId,
  });

  // Determine which tab to show based on attendance status
  useEffect(() => {
    if (mode === 'edit' && attendance) {
      // If status is 'work', show work tab; otherwise show absence tab
      const tab: DailyReportTab = attendance.status === 'work' ? 'work' : 'absence';
      setActiveTab(tab);
    }
  }, [mode, attendance]);

  // Show loading skeleton while fetching in edit mode
  if (mode === 'edit' && isLoadingAttendance) {
    return (
      <Modal
        opened={isOpen}
        onClose={onClose}
        fullScreen
        withCloseButton={false}
        classNames={{
          root: classes.modalRoot,
          inner: classes.modalInner,
          content: classes.modalContent,
          header: classes.modalHeader,
          body: classes.modalBody,
        }}
      >
        {/* Header */}
        <div className={classes.header}>
          <Text className={classes.title} size="lg" fw={600}>
            דיווח ידני
          </Text>
          <CloseButton
            onClick={onClose}
            size="lg"
            className={classes.closeButton}
            aria-label="סגור"
          />
        </div>

        {/* Loading Skeleton */}
        <Center style={{ minHeight: '400px' }}>
          <Stack gap="md" align="center">
            <Loader size="lg" color="blue" />
            <Text size="sm" c="dimmed">
              טוען נתונים...
            </Text>
          </Stack>
        </Center>
      </Modal>
    );
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      transitionProps={{ transition: 'slide-up', duration: 200 }}
      classNames={{
        root: classes.modalRoot,
        inner: classes.modalInner,
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      {/* Header */}
      <div className={classes.header}>
        <Text className={classes.title} size="lg" fw={600}>
          דיווח ידני
        </Text>
        <CloseButton
          onClick={onClose}
          size="lg"
          className={classes.closeButton}
          aria-label="סגור"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab(value as DailyReportTab)}
        classNames={{
          root: classes.tabsRoot,
          list: classes.tabsList,
          tab: classes.tab,
          panel: classes.tabPanel,
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="work" className={classes.tabItem}>
            דיווח עבודה
          </Tabs.Tab>
          <Tabs.Tab value="absence" className={classes.tabItem}>
            דיווח היעדרות
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="work">
          <WorkReportTab
            mode={mode}
            existingAttendanceId={existingAttendanceId}
            existingAttendance={mode === 'edit' ? attendance : undefined}
            defaultDate={defaultDate}
            onSuccess={onClose}
          />
        </Tabs.Panel>

        <Tabs.Panel value="absence">
          {/* TODO: Replace with AbsenceReportTab component (TASK-M2-020-FE-012) */}
          <div className={classes.tabContent}>
            <Text c="dimmed" ta="center" mt="xl">
              AbsenceReportTab component will be implemented in a future task
            </Text>
            <Text size="xs" c="dimmed" ta="center" mt="xs">
              Mode: {mode}
              {existingAttendanceId && ` | ID: ${existingAttendanceId}`}
              {defaultDate && ` | Date: ${defaultDate}`}
            </Text>
          </div>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
