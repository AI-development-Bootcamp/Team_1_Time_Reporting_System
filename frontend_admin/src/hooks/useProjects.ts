import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/utils/ApiClient';
import { CreateProjectInput } from '../types/Project';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  projectManagerId: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  reportingType: 'duration' | 'startEnd';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const PROJECTS_QUERY_KEY = ['projects'];

export function useProjects(clientId?: string) {
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, clientId],
    queryFn: async () => {
      const params = clientId ? `?clientId=${clientId}` : '';
      const res = await apiClient.get<Project[]>(`/admin/projects${params}`);
      return res.data;
    },
    enabled: true,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: CreateProjectInput) => {
      const res = await apiClient.post<{ id: string }>('/admin/projects', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProjectInput> }) => {
      const res = await apiClient.put<{ updated: boolean }>(`/admin/projects/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete<{ deleted: boolean }>(`/admin/projects/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });

  return {
    projectsQuery,
    createProjectMutation,
    updateProjectMutation,
    deleteProjectMutation,
  };
}

