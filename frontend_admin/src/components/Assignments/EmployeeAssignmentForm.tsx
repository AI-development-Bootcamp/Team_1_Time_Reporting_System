import { FC, useEffect, useState, useMemo } from 'react';
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  ActionIcon,
  Box,
  Loader,
  Center,
  TextInput,
  Table,
  Checkbox,
} from '@mantine/core';
import { IconX, IconPlus, IconSearch } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useAssignments, ASSIGNMENTS_QUERY_KEY } from '../../hooks/useAssignments';
import { useTasks, Task } from '../../hooks/useTasks';
import { useUsers } from '../../hooks/useUsers';
import { useProjects } from '../../hooks/useProjects';
import { ReusableTable } from '../Common/ReusableTable';
import { ReusablePagination } from '../Common/ReusablePagination';
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
  const { usersQuery } = useUsers();
  const { projectsQuery } = useProjects();
  const [task, setTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

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

  // Load task data
  useEffect(() => {
    if (taskId && opened) {
      if (tasksQuery.data) {
        const foundTask = tasksQuery.data.find((t) => t.id === taskId);
        setTask(foundTask || null);
      }
    }
  }, [taskId, opened, tasksQuery.data]);

  // Load current assignments for this task when modal opens
  useEffect(() => {
    if (taskId && opened && assignmentsQuery.data) {
      const taskAssignments = assignmentsQuery.data.filter(
        (assignment) => assignment.taskId === taskId
      );
      const currentUserIds = taskAssignments.map((a) => String(a.userId));
      // Only update if the values are different to avoid unnecessary re-renders
      if (JSON.stringify(currentUserIds.sort()) !== JSON.stringify(form.values.userIds.sort())) {
        form.setFieldValue('userIds', currentUserIds);
      }
    } else if (!opened) {
      // Reset form when modal closes
      form.reset();
      setSearchQuery('');
      setActivePage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, opened, assignmentsQuery.data]);

  const assignments = assignmentsQuery.data ?? [];

  const handleSubmit = async () => {
    if (!taskId) return;

    // Get current assignments for this task
    const currentAssignments = assignments.filter((a) => a.taskId === taskId);
    const currentUserIds = currentAssignments.map((a) => String(a.userId));

    const selectedUserIds = form.values.userIds;

    // Find users to add
    const usersToAdd = selectedUserIds.filter((id) => !currentUserIds.includes(id));
    // Find users to remove
    const usersToRemove = currentUserIds.filter((id) => !selectedUserIds.includes(id));

    try {
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

      // Invalidate and refetch assignments to get updated data with user info
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
      await assignmentsQuery.refetch();

      // Call onSubmit to close modal and refresh parent component
      // This will close the modal and refresh the data in ClientsTable
      onSubmit();
    } catch (error) {
      // Surface error feedback to user
      notifications.show({
        title: 'שגיאה',
        message: 'אירעה שגיאה בעדכון שיוך העובדים. אנא נסה שוב.',
        color: 'red',
      });
      // Do NOT call onSubmit on failure
    }
  };

  const users = usersQuery.data ?? [];
  const projects = projectsQuery.data ?? [];

  // Get project name for subtitle
  const projectName = useMemo(() => {
    if (!task) return '';
    const project = projects.find((p) => p.id === task.projectId);
    return project?.name || '';
  }, [task, projects]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((user) => user.name.toLowerCase().includes(query));
  }, [users, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery]);

  const handleUserToggle = (userId: string) => {
    const currentUserIds = form.values.userIds;
    if (currentUserIds.includes(userId)) {
      form.setFieldValue(
        'userIds',
        currentUserIds.filter((id) => id !== userId)
      );
    } else {
      form.setFieldValue('userIds', [...currentUserIds, userId]);
    }
  };


  if (assignmentsQuery.isLoading || usersQuery.isLoading || projectsQuery.isLoading) {
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
          width: 'calc(100vw - 640px)',
          maxWidth: '1200px',
          minWidth: '800px',
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Stack gap="lg">
          {/* Header */}
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
                  שיוך עובד חדש למשימה
                </Text>
                <Text size="sm" c="dimmed" mt={4} className="project-form-description">
                  {projectName
                    ? `כאן תוכל לשייך עובד חדש מהמאגר לטובת ${projectName}`
                    : 'כאן תוכל לשייך עובד חדש מהמאגר'}
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

          {/* Search Bar */}
          <TextInput
            placeholder="חיפוש לפי שם עובד"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            className="project-form-field"
            classNames={{
              input: 'project-form-field-input',
            }}
          />

          {/* Users Table */}
          <ReusableTable
            columns={[
              { label: '', align: 'center' },
              { label: "מס' עובד" },
              { label: 'שם מלא' },
              { label: 'תפקיד' },
            ]}
            isEmpty={filteredUsers.length === 0}
            emptyMessage="לא נמצאו עובדים"
          >
            {paginatedUsers.map((user) => {
              const userId = String(user.id);
              const isSelected = form.values.userIds.includes(userId);
              return (
                <Table.Tr key={user.id}>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) => {
                        event.stopPropagation();
                        handleUserToggle(userId);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{user.id}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{user.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {user.userType === 'admin' ? 'מנהל' : 'עובד'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </ReusableTable>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <ReusablePagination
              currentPage={activePage}
              totalPages={totalPages}
              onPageChange={setActivePage}
            />
          )}

          {/* Submit Button */}
          <Group justify="center" mt="md">
            <Button
              type="submit"
              loading={submitting}
              leftSection={<IconPlus size={18} />}
              size="md"
              fullWidth
              className="project-form-submit-button"
            >
              שייך עובד למשימה
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

