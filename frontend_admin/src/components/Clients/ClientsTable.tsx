import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Group,
  Table,
  Text,
  Stack,
  Loader,
  Center,
  ActionIcon,
  Pagination,
  TextInput,
  Menu,
} from '@mantine/core';
import { IconPencil, IconTrash, IconChevronDown, IconSearch } from '@tabler/icons-react';
import { Client } from '../../types/Client';
import { useClients } from '../../hooks/useClients';
import { useProjects } from '../../hooks/useProjects';
import { useAssignments } from '../../hooks/useAssignments';
import { ClientForm } from './ClientForm';
import { ProjectForm, CreateProjectInput } from '../Projects/ProjectForm';
import { TaskForm, CreateTaskInput } from '../Tasks/TaskForm';
import { EmployeeAssignmentForm } from '../Assignments/EmployeeAssignmentForm';
import { DeleteConfirmationModal } from '../Common/DeleteConfirmationModal';
import { DeleteAssignmentModal } from '../Assignments/DeleteAssignmentModal';
import '../../styles/components/ClientsTable.css';
import { useQueries } from '@tanstack/react-query';
import { apiClient } from '@shared/utils/ApiClient';
import { useTasks } from '../../hooks/useTasks';

interface TableRowData {
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  employeeNames: string[];
}

interface TableRowProps {
  rowData: TableRowData;
  onEditClient: (clientId: string) => void;
  onEditProject: (projectId: string) => void;
  onEditTask: (taskId: string) => void;
  onEditAssignment: (taskId: string) => void;
  onDeleteClient: (clientId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteAssignment: (taskId: string) => void;
}

function TableRow({ rowData, onEditClient, onEditProject, onEditTask, onEditAssignment, onDeleteClient, onDeleteProject, onDeleteTask, onDeleteAssignment }: TableRowProps) {
  const maxVisible = 3;
  const visibleNames = rowData.employeeNames.slice(0, maxVisible);
  const remainingCount = rowData.employeeNames.length - maxVisible;

  return (
    <Table.Tr className="clients-table-row">
      <Table.Td className="clients-table-cell">
        {rowData.clientName}
      </Table.Td>
      <Table.Td className="clients-table-cell">
        {rowData.projectName}
      </Table.Td>
      <Table.Td className="clients-table-cell">
        {rowData.taskName}
      </Table.Td>
      <Table.Td className="clients-table-cell">
        {rowData.employeeNames.length === 0 ? (
          <></>
        ) : (
          <Group gap="xs" wrap="wrap">
            {visibleNames.map((name, index) => (
              <div key={index} className="employee-name-badge">
                {name}
              </div>
            ))}
            {remainingCount > 0 && (
              <Text component="span" c="dimmed" size="sm">
                +{remainingCount}
              </Text>
            )}
          </Group>
        )}
      </Table.Td>
      <Table.Td className="clients-table-cell clients-table-cell-center">
        <Group gap="xs" justify="center">
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="blue"
                size="lg"
              >
                <IconPencil size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => onEditClient(rowData.clientId)}>
                ערוך לקוח
              </Menu.Item>
              <Menu.Item onClick={() => onEditProject(rowData.projectId)}>
                ערוך פרויקט
              </Menu.Item>
              <Menu.Item onClick={() => onEditTask(rowData.taskId)}>
                ערוך משימה
              </Menu.Item>
              <Menu.Item onClick={() => onEditAssignment(rowData.taskId)}>
                ערוך שיוך עובדים
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="red"
                size="lg"
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => onDeleteClient(rowData.clientId)}>
                מחק לקוח
              </Menu.Item>
              <Menu.Item onClick={() => onDeleteProject(rowData.projectId)}>
                מחק פרויקט
              </Menu.Item>
              <Menu.Item onClick={() => onDeleteTask(rowData.taskId)}>
                מחק משימה
              </Menu.Item>
              <Menu.Item onClick={() => onDeleteAssignment(rowData.taskId)}>
                מחק שיוך עובדים
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

export function ClientsTable() {
  const { clientsQuery, createClientMutation, updateClientMutation, deleteClientMutation } =
    useClients();
  const { createProjectMutation, updateProjectMutation, deleteProjectMutation } = useProjects();
  const { createTaskMutation, updateTaskMutation, deleteTaskMutation } = useTasks();
  const { assignmentsQuery } = useAssignments();

  const [formOpened, setFormOpened] = useState(false);
  const [projectFormOpened, setProjectFormOpened] = useState(false);
  const [taskFormOpened, setTaskFormOpened] = useState(false);
  const [assignmentFormOpened, setAssignmentFormOpened] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  // Delete confirmation modals state
  const [deleteClientModalOpened, setDeleteClientModalOpened] = useState(false);
  const [deleteProjectModalOpened, setDeleteProjectModalOpened] = useState(false);
  const [deleteTaskModalOpened, setDeleteTaskModalOpened] = useState(false);
  const [deleteAssignmentModalOpened, setDeleteAssignmentModalOpened] = useState(false);
  const [pendingDeleteClientId, setPendingDeleteClientId] = useState<string | null>(null);
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null);
  const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState<string | null>(null);
  const [pendingDeleteAssignmentTaskId, setPendingDeleteAssignmentTaskId] = useState<string | null>(null);

  // Load all projects for all clients
  const clients = clientsQuery.data ?? [];
  const projectsQueries = useQueries({
    queries: clients.map((client) => ({
      queryKey: ['projects', client.id],
      queryFn: async () => {
        const res = await apiClient.get(`/admin/projects?clientId=${client.id}`);
        return res.data;
      },
      enabled: !!clients.length,
    })),
  });

  // Load all tasks for all projects
  const allProjects = useMemo(() => {
    return projectsQueries.flatMap((query) => query.data ?? []);
  }, [projectsQueries]);

  const tasksQueries = useQueries({
    queries: allProjects.map((project) => ({
      queryKey: ['tasks', project.id],
      queryFn: async () => {
        const res = await apiClient.get(`/admin/tasks?projectId=${project.id}`);
        return res.data;
      },
      enabled: !!allProjects.length,
    })),
  });

  // Get all tasks
  const allTasks = useMemo(() => {
    return tasksQueries.flatMap((query) => query.data ?? []);
  }, [tasksQueries]);

  // Build table rows: one row per client-project-task combination
  const tableRows = useMemo<TableRowData[]>(() => {
    if (!clients.length || !allProjects.length) return [];
    const assignments = assignmentsQuery.data ?? [];

    // Create a map: taskId -> employee names
    const taskEmployeesMap = new Map<string, string[]>();
    assignments.forEach((assignment) => {
      if (assignment.taskId && assignment.user?.name) {
        const taskId = assignment.taskId;
        if (!taskEmployeesMap.has(taskId)) {
          taskEmployeesMap.set(taskId, []);
        }
        taskEmployeesMap.get(taskId)!.push(assignment.user.name);
      }
    });

    // Create a map: projectId -> project
    const projectMap = new Map<string, typeof allProjects[0]>();
    allProjects.forEach((project) => {
      projectMap.set(project.id, project);
    });

    // Create a map: clientId -> client
    const clientMap = new Map<string, Client>();
    clients.forEach((client) => {
      clientMap.set(client.id, client);
    });

    // Build rows: for each task, create a row
    const rows: TableRowData[] = [];
    allTasks.forEach((task) => {
      const project = projectMap.get(task.projectId);
      if (!project) return;

      const client = clientMap.get(project.clientId);
      if (!client) return;

      const employeeNames = taskEmployeesMap.get(task.id) ?? [];

      rows.push({
        clientId: client.id,
        clientName: client.name,
        projectId: project.id,
        projectName: project.name,
        taskId: task.id,
        taskName: task.name,
        employeeNames,
      });
    });

    return rows;
  }, [clients, allProjects, allTasks, assignmentsQuery.data]);

  const openCreateClient = () => {
    setSelectedClient(null);
    setFormMode('create');
    setFormOpened(true);
  };

  const openCreateProject = () => {
    setProjectFormOpened(true);
  };

  const handleCreateProject = async (values: CreateProjectInput) => {
    await createProjectMutation.mutateAsync(values);
    setProjectFormOpened(false);
  };

  const openCreateTask = () => {
    // TODO: Open task creation form
    console.log('Open task creation');
  };

  const openEditClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setFormMode('edit');
      setFormOpened(true);
    }
  };

  const openEditProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectFormOpened(true);
  };

  const openEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskFormOpened(true);
  };

  const openEditAssignment = (taskId: string) => {
    setSelectedTaskId(taskId);
    setAssignmentFormOpened(true);
  };

  const handleEditProject = async (values: CreateProjectInput) => {
    if (selectedProjectId) {
      await updateProjectMutation.mutateAsync({
        id: selectedProjectId,
        data: {
          name: values.name,
          clientId: values.clientId,
          projectManagerId: values.projectManagerId,
          startDate: values.startDate,
          endDate: values.endDate,
          description: values.description,
        },
      });
    }
    setProjectFormOpened(false);
    setSelectedProjectId(null);
  };

  const handleEditTask = async (values: CreateTaskInput) => {
    if (selectedTaskId) {
      await updateTaskMutation.mutateAsync({
        id: selectedTaskId,
        data: {
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
          description: values.description,
        },
      });
    } else {
      await createTaskMutation.mutateAsync(values);
    }
    setTaskFormOpened(false);
    setSelectedTaskId(null);
  };

  const handleEditAssignment = async () => {
    // Invalidate assignments query to refresh data
    assignmentsQuery.refetch();
    setAssignmentFormOpened(false);
    setSelectedTaskId(null);
  };

  const handleSubmit = async (values: { name: string; description?: string }) => {
    if (formMode === 'create') {
      await createClientMutation.mutateAsync(values);
    } else if (formMode === 'edit' && selectedClient) {
      await updateClientMutation.mutateAsync({
        id: selectedClient.id,
        data: {
          name: values.name,
          description: values.description,
        },
      });
    }
    setFormOpened(false);
  };

  const openDeleteClient = (clientId: string) => {
    setPendingDeleteClientId(clientId);
    setDeleteClientModalOpened(true);
  };

  const openDeleteProject = (projectId: string) => {
    setPendingDeleteProjectId(projectId);
    setDeleteProjectModalOpened(true);
  };

  const openDeleteTask = (taskId: string) => {
    setPendingDeleteTaskId(taskId);
    setDeleteTaskModalOpened(true);
  };

  const openDeleteAssignment = (taskId: string) => {
    setPendingDeleteAssignmentTaskId(taskId);
    setDeleteAssignmentModalOpened(true);
  };

  const handleDeleteClient = async () => {
    if (pendingDeleteClientId) {
      await deleteClientMutation.mutateAsync(pendingDeleteClientId);
      setDeleteClientModalOpened(false);
      setPendingDeleteClientId(null);
    }
  };

  const handleDeleteProject = async () => {
    if (pendingDeleteProjectId) {
      await deleteProjectMutation.mutateAsync(pendingDeleteProjectId);
      setDeleteProjectModalOpened(false);
      setPendingDeleteProjectId(null);
    }
  };

  const handleDeleteTask = async () => {
    if (pendingDeleteTaskId) {
      await deleteTaskMutation.mutateAsync(pendingDeleteTaskId);
      setDeleteTaskModalOpened(false);
      setPendingDeleteTaskId(null);
    }
  };

  const handleDeleteAssignment = async (selectedUserIds: string[]) => {
    if (pendingDeleteAssignmentTaskId && selectedUserIds.length > 0) {
      const taskId = pendingDeleteAssignmentTaskId;
      for (const userId of selectedUserIds) {
        await apiClient.delete(`/admin/assignments/${taskId}:${userId}`);
      }
      assignmentsQuery.refetch();
      setDeleteAssignmentModalOpened(false);
      setPendingDeleteAssignmentTaskId(null);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery]);

  // Check loading states
  const isLoading =
    clientsQuery.isLoading ||
    projectsQueries.some((q) => q.isLoading) ||
    tasksQueries.some((q) => q.isLoading) ||
    assignmentsQuery.isLoading;

  if (isLoading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  if (clientsQuery.isError) {
    return (
      <Center h={200}>
        <Text c="red">Failed to load data.</Text>
      </Center>
    );
  }

  // Filter rows by search query (client name)
  const filteredRows = tableRows.filter((row) =>
    row.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  return (
    <Stack gap={0} className="clients-table-container">
      <Group justify="flex-end" gap="md" mb="md">
        <TextInput
          placeholder="חיפוש לפי שם לקוח"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          className="search-input"
        />
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <Button
              leftSection={<IconChevronDown size={16} />}
              className="create-button"
            >
              יצירה
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item onClick={openCreateClient}>
              צור לקוח חדש
            </Menu.Item>
            <Menu.Item onClick={openCreateProject}>
              צור פרויקט חדש
            </Menu.Item>
            <Menu.Item onClick={openCreateTask}>
              צור משימה חדשה
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Table withTableBorder className="clients-table">
        <Table.Thead>
          <Table.Tr className="clients-table-header">
            <Table.Th className="clients-table-header-cell">
              שם לקוח
            </Table.Th>
            <Table.Th className="clients-table-header-cell">
              שם פרויקט
            </Table.Th>
            <Table.Th className="clients-table-header-cell">
              שם משימה
            </Table.Th>
            <Table.Th className="clients-table-header-cell">
              שמות העובדים המשוייכים
            </Table.Th>
            <Table.Th className="clients-table-header-cell clients-table-header-cell-center">
              פעולות
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {paginatedRows.map((row, index) => (
            <TableRow
              key={`${row.clientId}-${row.projectId}-${row.taskId}-${index}`}
              rowData={row}
              onEditClient={openEditClient}
              onEditProject={openEditProject}
              onEditTask={openEditTask}
              onEditAssignment={openEditAssignment}
              onDeleteClient={openDeleteClient}
              onDeleteProject={openDeleteProject}
              onDeleteTask={openDeleteTask}
              onDeleteAssignment={openDeleteAssignment}
            />
          ))}

          {filteredRows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5} className="clients-table-cell">
                <Text ta="center" c="dimmed" py="xl">
                  לא נמצאו נתונים
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {filteredRows.length > 0 && (
        <Group justify="center" mt="md" className="pagination-container">
          <Pagination
            value={activePage}
            onChange={setActivePage}
            total={totalPages}
            siblings={1}
            withEdges
            boundaries={1}
            classNames={{
              control: 'pagination-control',
            }}
          />
        </Group>
      )}

      <ClientForm
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        mode={formMode}
        initialClient={selectedClient}
        onSubmit={handleSubmit}
        submitting={
          createClientMutation.isPending || updateClientMutation.isPending
        }
      />

      <ProjectForm
        opened={projectFormOpened}
        onClose={() => {
          setProjectFormOpened(false);
          setSelectedProjectId(null);
        }}
        onSubmit={selectedProjectId ? handleEditProject : handleCreateProject}
        submitting={createProjectMutation.isPending || updateProjectMutation.isPending}
        mode={selectedProjectId ? 'edit' : 'create'}
        initialProjectId={selectedProjectId}
      />

      <TaskForm
        opened={taskFormOpened}
        onClose={() => {
          setTaskFormOpened(false);
          setSelectedTaskId(null);
        }}
        mode={selectedTaskId ? 'edit' : 'create'}
        initialTask={selectedTaskId ? allTasks.find((t) => t.id === selectedTaskId) || null : null}
        onSubmit={handleEditTask}
        submitting={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      <EmployeeAssignmentForm
        opened={assignmentFormOpened}
        onClose={() => {
          setAssignmentFormOpened(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
        onSubmit={handleEditAssignment}
        submitting={false}
      />

      {/* Delete Confirmation Modals */}
      {pendingDeleteClientId && (
        <DeleteConfirmationModal
          opened={deleteClientModalOpened}
          onClose={() => {
            setDeleteClientModalOpened(false);
            setPendingDeleteClientId(null);
          }}
          onConfirm={handleDeleteClient}
          title="מחיקת לקוח"
          message="האם אתה בטוח שברצונך למחוק לקוח זה?"
          confirming={deleteClientMutation.isPending}
        />
      )}

      {pendingDeleteProjectId && (
        <DeleteConfirmationModal
          opened={deleteProjectModalOpened}
          onClose={() => {
            setDeleteProjectModalOpened(false);
            setPendingDeleteProjectId(null);
          }}
          onConfirm={handleDeleteProject}
          title="מחיקת פרויקט"
          message="האם אתה בטוח שברצונך למחוק פרויקט זה?"
          confirming={deleteProjectMutation.isPending}
        />
      )}

      {pendingDeleteTaskId && (
        <DeleteConfirmationModal
          opened={deleteTaskModalOpened}
          onClose={() => {
            setDeleteTaskModalOpened(false);
            setPendingDeleteTaskId(null);
          }}
          onConfirm={handleDeleteTask}
          title="מחיקת משימה"
          message="האם אתה בטוח שברצונך למחוק משימה זו?"
          confirming={deleteTaskMutation.isPending}
        />
      )}

      {pendingDeleteAssignmentTaskId && (
        <DeleteAssignmentModal
          opened={deleteAssignmentModalOpened}
          onClose={() => {
            setDeleteAssignmentModalOpened(false);
            setPendingDeleteAssignmentTaskId(null);
          }}
          onConfirm={handleDeleteAssignment}
          taskId={pendingDeleteAssignmentTaskId}
          confirming={false}
        />
      )}
    </Stack>
  );
}

