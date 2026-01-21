/**
 * DailyReportModal Component
 * Full-screen modal for creating/editing daily attendance reports
 * 
 * Features:
 * - Mobile-first, RTL design
 * - Two tabs: Work Report / Absence Report
 * - Full-screen modal with header
 */

import { useState } from 'react';
import { Modal, Tabs, CloseButton, Text } from '@mantine/core';
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
