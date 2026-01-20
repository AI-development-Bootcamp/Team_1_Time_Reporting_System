import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@services/ProjectService';
import { clientService } from '@services/ClientService';
import type { Project, ReportingType } from '../types/Project';

// Helper to check if we're in development mode (type-safe)
const isDev = (): boolean => {
  return (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false;
};

/**
 * Project with Client data joined
 */
export interface ProjectWithClient extends Project {
  client: {
    id: number | string;
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
   * Backend is responsible for returning only active projects
   */
  const projectsQuery = useQuery<ProjectWithClient[]>({
    queryKey,
    queryFn: async () => {
      // Fetch both projects and clients in parallel using services
      const [projects, clients] = await Promise.all([
        projectService.getProjects(),
        clientService.getClients()
      ]);

      // Create a map of clients for quick lookup
      // Both backend services return string IDs (serializeData and toString()),
      // so we use string keys for the map
      const clientMap = new Map(clients.map(c => [String(c.id), c]));

      // Join projects with client data
      // Note: Backend is responsible for returning only active projects
      const projectsWithClients: ProjectWithClient[] = projects.map(project => {
        const clientIdStr = String(project.clientId);
        const client = clientMap.get(clientIdStr);
        
        return {
          ...project,
          client: {
            id: project.clientId,
            name: client?.name || 'Unknown Client'
          }
        } as ProjectWithClient;
      });

      return projectsWithClients;
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
      return await projectService.updateReportingType(projectId, reportingType);
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
      if (isDev()) {
        console.error('Failed to update reporting type:', err);
      }
    },

    // Invalidate and refetch on success
    // Note: We already optimistically updated, but invalidating ensures we get the latest data from the server
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
