import React from 'react';
import { Modal, Group, Text, ActionIcon, Button, Stack } from '@mantine/core';
import TabNavigation from './TabNavigation';
import TimeEntryFields from './TimeEntryFields';
import AddProjectButton from './AddProjectButton';
import dayjs from 'dayjs';
import styles from './ManualReportModal.module.css';

interface ManualReportModalProps {
  opened: boolean;
  onClose: () => void;
  activeTab: 'absence' | 'work';
  onTabChange: (tab: 'absence' | 'work') => void;
  selectedDate: Date;
  entryTime: string;
  exitTime: string;
  onEntryTimeChange: (time: string) => void;
  onExitTimeChange: (time: string) => void;
  onAddProject: () => void;
}

const ManualReportModal: React.FC<ManualReportModalProps> = ({
  opened,
  onClose,
  activeTab,
  onTabChange,
  selectedDate,
  entryTime,
  exitTime,
  onEntryTimeChange,
  onExitTimeChange,
  onAddProject,
}) => {
  // Format date in Hebrew: "יום ה' 06/10/25"
  const formatHebrewDate = (date: Date) => {
    const dayNames = ['יום א\'', 'יום ב\'', 'יום ג\'', 'יום ד\'', 'יום ה\'', 'יום ו\'', 'שבת'];
    const dayIndex = date.getDay();
    const dayName = dayNames[dayIndex];
    const formattedDate = dayjs(date).format('DD/MM/YY');
    return `${dayName} ${formattedDate}`;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      title={
        <Group justify="space-between" className={styles.headerRow}>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onClose}
            radius="xl"
            size="lg"
            className={styles.closeButton}
          >
            <Text size="lg" fw={600} c="white" className={styles.closeButtonIcon}>
              ×
            </Text>
          </ActionIcon>
          <Text fw={700} size="lg" className={styles.modalTitle}>
            דיווח ידני
          </Text>
          <div className={styles.modalTitleSpacer} /> {/* Spacer for centering */}
        </Group>
      }
      centered
      size="auto"
      padding="xl"
      overlayProps={{
        backgroundOpacity: 0.5,
        blur: 0,
      }}
      classNames={{
        content: styles.modalContent,
        body: styles.modalBody,
        header: styles.modalHeader,
        overlay: styles.modalOverlay,
      }}
    >
      <Stack className={styles.contentStack} justify="space-between">
        <div>
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
          
          <Text size="sm" c="dimmed" mt="md" mb="md" className={styles.dateText}>
            {formatHebrewDate(selectedDate)}
          </Text>

          <TimeEntryFields
            entryTime={entryTime}
            exitTime={exitTime}
            onEntryTimeChange={onEntryTimeChange}
            onExitTimeChange={onExitTimeChange}
          />

          <AddProjectButton onClick={onAddProject} />
        </div>

        <Button
          fullWidth
          mt="md"
          radius="md"
          className={styles.saveButton}
        >
          <Text c="white" fw={600}>
            שמירה
          </Text>
        </Button>
      </Stack>
    </Modal>
  );
};

export default ManualReportModal;

