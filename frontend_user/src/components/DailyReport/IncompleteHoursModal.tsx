/**
 * IncompleteHoursModal Component
 * Warning modal for incomplete work hours reporting
 * 
 * Features:
 * - Yellow warning icon
 * - Hebrew warning message with missing hours
 * - Cancel and confirm buttons
 * - Mobile-first, RTL design
 */

import { Modal, Button, Stack, Text, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { formatDurationHours } from '../../utils/dateUtils';
import classes from './IncompleteHoursModal.module.css';

interface IncompleteHoursModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when user confirms to save partial report */
  onConfirm: () => void;
  /** Number of missing minutes */
  missingHours: number;
}

/**
 * IncompleteHoursModal - Warning dialog for incomplete work hours
 * 
 * @example
 * <IncompleteHoursModal
 *   isOpen={showWarning}
 *   onClose={() => setShowWarning(false)}
 *   onConfirm={handleSavePartial}
 *   missingHours={90} // 1:30 hours missing
 * />
 */
export function IncompleteHoursModal({
  isOpen,
  onClose,
  onConfirm,
  missingHours,
}: IncompleteHoursModalProps) {
  // Format missing hours for display (e.g., "01:30")
  const formattedMissingHours = formatDurationHours(missingHours);

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      centered
      size="sm"
      withCloseButton={false}
      classNames={{
        content: classes.modalContent,
        body: classes.modalBody,
      }}
    >
      <Stack gap="lg" align="center">
        {/* Warning Icon */}
        <div className={classes.iconContainer}>
          <IconAlertTriangle
            size={64}
            className={classes.warningIcon}
            strokeWidth={1.5}
          />
        </div>

        {/* Title */}
        <Text size="lg" fw={600} ta="center" className={classes.title}>
          יום העבודה שלך טרם הושלם
        </Text>

        {/* Message with missing hours */}
        <Text size="sm" c="dimmed" ta="center" className={classes.message}>
          חסרות {formattedMissingHours} שעות לדיווח. האם אתה בטוח שרצית להמשיך?
        </Text>

        {/* Buttons */}
        <Group gap="md" className={classes.buttonGroup}>
          {/* Cancel Button - Light Grey */}
          <Button
            variant="default"
            size="md"
            onClick={onClose}
            className={classes.cancelButton}
          >
            מעדיף שלא למחוק
          </Button>

          {/* Confirm Button - Navy Blue */}
          <Button
            size="md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={classes.confirmButton}
          >
            צא בכל זאת
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
