import { FC } from 'react';
import { Modal, Text, Button, Group, ActionIcon, Box } from '@mantine/core';
import { IconTrash, IconX } from '@tabler/icons-react';
import '../../styles/components/DeleteConfirmationModal.css';

interface DeleteConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirming?: boolean;
}

export const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirming = false,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size="md"
      withCloseButton={false}
      styles={{
        content: {
          borderRadius: '12px',
          width: 'calc((100vw - 320px) / 3)',
          maxWidth: '500px',
          minWidth: '400px',
        },
        inner: {
          paddingRight: '320px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
        },
      }}
    >
      <Box className="delete-confirmation-modal">
        <Group justify="space-between" align="flex-start" mb="lg" className="delete-confirmation-header">
          <Group gap="md">
            <ActionIcon
              variant="subtle"
              color="red"
              size="lg"
              radius="xl"
              className="delete-confirmation-icon"
            >
              <IconTrash size={24} />
            </ActionIcon>
            <Text fw={700} size="xl" className="delete-confirmation-title">
              {title}
            </Text>
          </Group>
          <ActionIcon
            variant="subtle"
            onClick={onClose}
            size="lg"
            className="delete-confirmation-close-button"
          >
            <IconX size={20} />
          </ActionIcon>
        </Group>

        <Text size="md" mb="xl" className="delete-confirmation-message">
          {message}
        </Text>

        <Group justify="space-evenly" gap="lg" mt="xl" className="delete-confirmation-buttons-group">
          <Button
            variant="filled"
            onClick={onConfirm}
            loading={confirming}
            className="delete-confirmation-delete-button"
          >
            מחיקה
          </Button>
          <Button
            variant="filled"
            onClick={onClose}
            disabled={confirming}
            className="delete-confirmation-cancel-button"
          >
            ביטול
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};

