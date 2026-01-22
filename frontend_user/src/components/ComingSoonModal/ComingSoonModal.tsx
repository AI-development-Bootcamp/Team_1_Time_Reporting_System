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
