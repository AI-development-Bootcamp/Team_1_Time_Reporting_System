import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/utils/ApiClient';

export interface Task {
  id: string;
  name: string;
  projectId: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  name: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface UpdateTaskInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: 'open' | 'closed';
}

const TASKS_QUERY_KEY = ['tasks'];

export function useTasks(projectId?: string) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: [...TASKS_QUERY_KEY, projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : '';
      const res = await apiClient.get<Task[]>(`/admin/tasks${params}`);
      return res.data;
    },
    enabled: !!projectId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: CreateTaskInput) => {
      const res = await apiClient.post<{ id: string }>('/admin/tasks', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const res = await apiClient.put<{ updated: boolean }>(`/admin/tasks/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete<{ deleted: boolean }>(`/admin/tasks/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  return {
    tasksQuery,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
  };
}

