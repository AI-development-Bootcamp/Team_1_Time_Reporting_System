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
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAssignments, ASSIGNMENTS_QUERY_KEY } from '../../hooks/useAssignments';
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
  const { tasksQuery } = useTasks('all');
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  const form = useForm<{
    userIds: string[];
  }>({
    initialValues: {
      userIds: [],
    },
  });

  const queryClient = useQueryClient();

  const addAssignmentMutation = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      await apiClient.post('/admin/assignments', {
        taskId,
        userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      await apiClient.delete(`/admin/assignments/${taskId}:${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
    },
  });

  // Load task data and users
  useEffect(() => {
    if (taskId && opened) {
      if (tasksQuery.data) {
        const foundTask = tasksQuery.data.find((t) => t.id === taskId);
        setTask(foundTask || null);
      }
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
  }, [taskId, opened, assignmentsQuery.data, tasksQuery.data]);

  // Load current assignments for this task
  useEffect(() => {
    if (taskId && opened && assignmentsQuery.data) {
      const taskAssignments = assignmentsQuery.data.filter(
        (assignment) => assignment.taskId === taskId
      );
      form.setFieldValue(
        'userIds',
        taskAssignments.map((a) => a.userId)
      );
    }
  }, [taskId, opened, assignmentsQuery.data]);

  const assignments = assignmentsQuery.data ?? [];

  const handleSubmit = async () => {
    if (!taskId) return;

    // Get current assignments for this task
    const currentAssignments = assignments.filter((a) => a.taskId === taskId);
    const currentUserIds = currentAssignments.map((a) => a.userId);

    const selectedUserIds = form.values.userIds;

    // Find users to add
    const usersToAdd = selectedUserIds.filter((id) => !currentUserIds.includes(id));
    // Find users to remove
    const usersToRemove = currentUserIds.filter((id) => !selectedUserIds.includes(id));

    // Add new assignments
    await Promise.all(
      usersToAdd.map((userId) =>
        addAssignmentMutation.mutateAsync({
          taskId,
          userId,
        })
      )
    );

    // Remove old assignments
    await Promise.all(
      usersToRemove.map((userId) =>
        removeAssignmentMutation.mutateAsync({
          taskId,
          userId,
        })
      )
    );

    // Ensure assignments are refreshed after all mutations complete
    await assignmentsQuery.refetch();

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
                aria-hidden="true"
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
              aria-label="Close"
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>

          <Stack gap="md">
            <MultiSelect
              label="עובדים"
              placeholder="בחר עובדים"
              data={users.map((user) => ({ value: user.id, label: user.name }))}
              searchable
              className="project-form-field"
              classNames={{
                label: 'project-form-field-label',
                input: 'project-form-field-input',
              }}
              {...form.getInputProps('userIds')}
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

