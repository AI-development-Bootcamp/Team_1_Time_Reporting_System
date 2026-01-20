import { FC, useEffect, useState } from 'react';
import {
  Modal,
  Text,
  Button,
  Group,
  ActionIcon,
  Box,
  MultiSelect,
  Stack,
} from '@mantine/core';
import { IconTrash, IconX } from '@tabler/icons-react';
import { useAssignments, Assignment } from '../../hooks/useAssignments';
import '../../styles/components/DeleteAssignmentModal.css';

interface DeleteAssignmentModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (selectedUserIds: string[]) => void;
  taskId: string | null;
  confirming?: boolean;
}

export const DeleteAssignmentModal: FC<DeleteAssignmentModalProps> = ({
  opened,
  onClose,
  onConfirm,
  taskId,
  confirming = false,
}) => {
  const { assignmentsQuery } = useAssignments();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Get assignments for this task
  const assignments = assignmentsQuery.data ?? [];
  const taskAssignments = taskId
    ? assignments.filter((a) => a.taskId === taskId)
    : [];

  // Get users from assignments
  const users = taskAssignments
    .map((assignment) => assignment.user)
    .filter((user): user is NonNullable<typeof user> => !!user)
    .map((user) => ({
      id: user.id,
      name: user.name,
    }));

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!opened) {
      setSelectedUserIds([]);
    }
  }, [opened]);

  const handleConfirm = () => {
    if (selectedUserIds.length > 0) {
      onConfirm(selectedUserIds);
      setSelectedUserIds([]);
    }
  };

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
          right: '320px',
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
              מחיקת שיוך עובדים
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

        <Stack gap="md" mb="xl">
          <Text size="md" className="delete-confirmation-message">
            בחר את העובדים שברצונך להסיר מהמשימה:
          </Text>

          <MultiSelect
            label="עובדים"
            placeholder="בחר עובדים למחיקה"
            data={users.map((user) => ({ value: user.id, label: user.name }))}
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            searchable
            className="project-form-field"
            classNames={{
              label: 'project-form-field-label',
              input: 'project-form-field-input',
            }}
          />
        </Stack>

        <Group justify="space-evenly" gap="lg" mt="xl" className="delete-assignment-buttons-group">
          <Button
            variant="filled"
            onClick={handleConfirm}
            disabled={confirming || selectedUserIds.length === 0}
            className="delete-assignment-delete-button"
          >
            מחיקה
          </Button>
          <Button
            variant="filled"
            onClick={onClose}
            disabled={confirming}
            className="delete-assignment-cancel-button"
          >
            ביטול
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};

