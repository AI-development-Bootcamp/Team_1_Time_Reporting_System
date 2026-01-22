/**
 * DeleteProjectConfirmModal Component
 * Confirmation modal for deleting a project from daily report
 * 
 * Features:
 * - Yellow warning icon
 * - Hebrew confirmation message with project name
 * - Cancel and confirm delete buttons
 * - Mobile-first, RTL design
 */

import { Modal, Button, Stack, Text, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import classes from './DeleteProjectConfirmModal.module.css';

interface DeleteProjectConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when user confirms deletion */
  onConfirm: () => void;
  /** Name of the project to be deleted */
  projectName: string;
}

/**
 * DeleteProjectConfirmModal - Confirmation dialog for project deletion
 * 
 * @example
 * <DeleteProjectConfirmModal
 *   isOpen={showDeleteConfirm}
 *   onClose={() => setShowDeleteConfirm(false)}
 *   onConfirm={handleDeleteProject}
 *   projectName="פרויקט א'"
 * />
 */
export function DeleteProjectConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}: DeleteProjectConfirmModalProps) {
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
          למחוק את פרויקט זה מהדוווח?
        </Text>

        {/* Project Name Badge */}
        {projectName && (
          <div className={classes.projectBadge}>
            <Text size="sm" fw={500}>
              {projectName}
            </Text>
          </div>
        )}

        {/* Message */}
        <Text size="sm" c="dimmed" ta="center" className={classes.message}>
          הפעולה תסיר את כל השיוכים של הפרויקט מזה דיווח השעות. האם אתה בטוח שרצית להמשיך?
        </Text>

        {/* Buttons */}
        <Group gap="md" className={classes.buttonGroup}>
          {/* Cancel Button */}
          <Button
            variant="default"
            size="md"
            onClick={onClose}
            className={classes.cancelButton}
          >
            מעדיף שלא למחוק
          </Button>

          {/* Confirm Delete Button - Navy Blue */}
          <Button
            size="md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={classes.confirmButton}
          >
            מחק את הפרויקט
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
