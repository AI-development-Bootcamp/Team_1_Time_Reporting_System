import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/ApiClient';
import { apiClient as sharedApiClient } from '@shared/utils/ApiClient';
import type { Project, ReportingType } from '../types/Project';
import type { Client } from '../types/Client';

/**
 * Project with Client data joined
 */
export interface ProjectWithClient extends Project {
  client: {
    id: number;
    name: string;
  };
}

/**
 * Hook for managing reporting settings data fetching and mutations
 * 
 * Features:
 * - Fetches projects with client data joined
 * - Updates project reporting type with optimistic updates
 * - Handles rollback on error
 * - Invalidates queries on success
 */
export function useReportingSettings() {
  const queryClient = useQueryClient();
  const queryKey = ['projects', 'reporting-settings'];

  /**
   * Fetch all projects with client data joined
   * 
   * Fetches projects and clients from the backend, then joins them on the frontend
   * Only returns active projects
   */
  const projectsQuery = useQuery<ProjectWithClient[]>({
    queryKey,
    queryFn: async () => {
      // Fetch both projects and clients in parallel
      const [projectsResponse, clientsResponse] = await Promise.all([
        sharedApiClient.get<Project[]>('/admin/projects'),
        sharedApiClient.get<Client[]>('/admin/clients')
      ]);

      const projects = projectsResponse.data;
      const clients = clientsResponse.data;

      // Create a map of clients for quick lookup
      const clientMap = new Map(clients.map(c => [c.id, c]));

      // Filter active projects and join with client data
      const activeProjects = projects
        .filter(p => p.active) // Only show active projects
        .map(project => ({
          ...project,
          client: {
            id: project.clientId,
            name: clientMap.get(project.clientId)?.name || 'Unknown Client'
          }
        }));

      return activeProjects;
    },
  });

  /**
   * Update project reporting type with optimistic updates
   * 
   * Sends PATCH request to backend and updates local cache optimistically
   */
  const updateReportingTypeMutation = useMutation({
    mutationFn: async ({
      projectId,
      reportingType,
    }: {
      projectId: number;
      reportingType: ReportingType;
    }) => {
      return await apiClient.patchProjectReportingType(projectId, reportingType);
    },

    // Optimistic update: update local state immediately
    onMutate: async ({ projectId, reportingType }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<ProjectWithClient[]>(queryKey);

      // Optimistically update to the new value
      if (previousProjects) {
        queryClient.setQueryData<ProjectWithClient[]>(
          queryKey,
          previousProjects.map((project) =>
            project.id === projectId
              ? { ...project, reportingType }
              : project
          )
        );
      }

      // Return a context object with the snapshotted value
      return { previousProjects };
    },

    // Rollback on error
    onError: (err, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKey, context.previousProjects);
      }
      console.error('Failed to update reporting type:', err);
    },

    // Invalidate and refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    // Query state
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
    error: projectsQuery.error,
    refetch: projectsQuery.refetch,

    // Mutation
    updateReportingType: updateReportingTypeMutation.mutate,
    isUpdating: updateReportingTypeMutation.isPending,
  };
}
