/**
 * ComingSoonModal Component
 * Simple modal displaying "Coming soon" message
 */

import { Modal, Text, Stack, Button } from '@mantine/core';
import { HEBREW_STRINGS } from '../../utils/constants';

interface ComingSoonModalProps {
  /** Whether the modal is open */
  opened: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Render a centered "Coming soon" modal with a title, message, and dismiss button.
 *
 * @param opened - Whether the modal is visible
 * @param onClose - Callback invoked when the modal should be closed
 * @returns The modal element containing the title, message, and a button that triggers `onClose`
 */
export function ComingSoonModal({ opened, onClose }: ComingSoonModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="xs"
      withCloseButton={false}
    >
      <Stack align="center" gap="md" py="md">
        <Text size="lg" fw={600} ta="center">
          {HEBREW_STRINGS.comingSoonTitle}
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {HEBREW_STRINGS.comingSoonMessage}
        </Text>
        <Button onClick={onClose} variant="light" color="pink">
          {HEBREW_STRINGS.comingSoonButton}
        </Button>
      </Stack>
    </Modal>
  );
}