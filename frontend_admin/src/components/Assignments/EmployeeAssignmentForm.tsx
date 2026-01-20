import { FC, useEffect, useState } from 'react';
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  ActionIcon,
  Box,
  MultiSelect,
  Loader,
  Center,
} from '@mantine/core';
import { IconX, IconPlus } from '@tabler/icons-react';
import { useAssignments, Assignment } from '../../hooks/useAssignments';
import { useTasks, Task } from '../../hooks/useTasks';
import '../../styles/components/EmployeeAssignmentForm.css';
import '../../styles/components/ProjectForm.css';
import { apiClient } from '@shared/utils/ApiClient';

interface EmployeeAssignmentFormProps {
  opened: boolean;
  onClose: () => void;
  taskId: string | null;
  onSubmit: () => void;
  submitting?: boolean;
}

export const EmployeeAssignmentForm: FC<EmployeeAssignmentFormProps> = ({
  opened,
  onClose,
  taskId,
  onSubmit,
  submitting = false,
}) => {
  const { assignmentsQuery } = useAssignments();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Load task data and users
  useEffect(() => {
    if (taskId && opened) {
      apiClient.get(`/admin/tasks?projectId=all`).then((res) => {
        const tasks = res.data as Task[];
        const foundTask = tasks.find((t) => t.id === taskId);
        setTask(foundTask || null);
      });
      // Load users from assignments
      if (assignmentsQuery.data) {
        const uniqueUsers = new Map<string, { id: string; name: string }>();
        assignmentsQuery.data.forEach((assignment) => {
          if (assignment.user) {
            uniqueUsers.set(assignment.user.id, {
              id: assignment.user.id,
              name: assignment.user.name,
            });
          }
        });
        setUsers(Array.from(uniqueUsers.values()));
      }
    }
  }, [taskId, opened, assignmentsQuery.data]);

  // Load current assignments for this task
  useEffect(() => {
    if (taskId && opened && assignmentsQuery.data) {
      const taskAssignments = assignmentsQuery.data.filter(
        (assignment) => assignment.taskId === taskId
      );
      setSelectedUserIds(taskAssignments.map((a) => a.userId));
    }
  }, [taskId, opened, assignmentsQuery.data]);

  const assignments = assignmentsQuery.data ?? [];

  const handleSubmit = async () => {
    if (!taskId) return;

    // Get current assignments for this task
    const currentAssignments = assignments.filter((a) => a.taskId === taskId);
    const currentUserIds = currentAssignments.map((a) => a.userId);

    // Find users to add
    const usersToAdd = selectedUserIds.filter((id) => !currentUserIds.includes(id));
    // Find users to remove
    const usersToRemove = currentUserIds.filter((id) => !selectedUserIds.includes(id));

    // Add new assignments
    for (const userId of usersToAdd) {
      await apiClient.post('/admin/assignments', {
        taskId: taskId,
        userId: userId,
      });
    }

    // Remove old assignments
    for (const userId of usersToRemove) {
      await apiClient.delete(`/admin/assignments/${taskId}:${userId}`);
    }

    onSubmit();
  };

  if (assignmentsQuery.isLoading) {
    return (
      <Modal opened={opened} onClose={onClose} title={null} centered>
        <Center h={200}>
          <Loader />
        </Center>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size="lg"
      withCloseButton={false}
      styles={{
        content: {
          borderRadius: '12px',
          width: 'calc((100vw - 320px) / 3)',
          maxWidth: '600px',
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" className="project-form-header">
            <Group gap="md">
              <ActionIcon
                variant="subtle"
                color="blue"
                size="lg"
                radius="xl"
                className="project-form-icon-button"
              >
                <IconPlus size={20} />
              </ActionIcon>
              <Box>
                <Text fw={700} size="xl" className="project-form-title">
                  ערוך שיוך עובדים
                </Text>
                <Text size="sm" c="dimmed" mt={4} className="project-form-description">
                  בחר את העובדים המשויכים למשימה
                </Text>
              </Box>
            </Group>
            <ActionIcon
              variant="subtle"
              onClick={onClose}
              size="lg"
              className="project-form-close-button"
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>

          <Stack gap="md">
            <MultiSelect
              label="עובדים"
              placeholder="בחר עובדים"
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

          <Group justify="center" mt="md">
            <Button
              type="submit"
              loading={submitting}
              leftSection={<IconPlus size={18} />}
              size="md"
              fullWidth
              className="project-form-submit-button"
            >
              שמור שינויים
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

