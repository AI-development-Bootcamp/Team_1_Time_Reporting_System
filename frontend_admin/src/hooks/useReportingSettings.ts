import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// TODO: Uncomment these imports when backend is ready
// import { apiClient } from '../utils/ApiClient';
// import { apiClient as sharedApiClient } from '@shared/utils/ApiClient';
import type { Project, ReportingType } from '../types/Project';

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
   * TODO: Remove mock data once backend endpoint is implemented by Member 3
   */
  const projectsQuery = useQuery<ProjectWithClient[]>({
    queryKey,
    queryFn: async () => {
      // TEMPORARY MOCK DATA - Replace with actual API call once backend is ready
      // Uncomment the lines below when backend is implemented:
      // const response = await sharedApiClient.get<ProjectWithClient[]>('/admin/projects');
      // return response.data;
      
      // Mock data for testing
      return [
        {
          id: 1,
          name: "Frontend Development",
          clientId: 1,
          projectManagerId: 1,
          startDate: "2026-01-01",
          endDate: null,
          description: "Building the admin dashboard",
          reportingType: "startEnd",
          active: true,
          createdAt: "2026-01-01T09:00:00.000Z",
          updatedAt: "2026-01-10T09:00:00.000Z",
          client: {
            id: 1,
            name: "Tech Corp"
          }
        },
        {
          id: 2,
          name: "Backend API",
          clientId: 1,
          projectManagerId: 1,
          startDate: "2026-01-01",
          endDate: null,
          description: "REST API development",
          reportingType: "duration",
          active: true,
          createdAt: "2026-01-01T09:00:00.000Z",
          updatedAt: "2026-01-10T09:00:00.000Z",
          client: {
            id: 1,
            name: "Tech Corp"
          }
        },
        {
          id: 3,
          name: "Mobile App",
          clientId: 2,
          projectManagerId: 1,
          startDate: "2026-01-15",
          endDate: "2026-06-30",
          description: "iOS and Android development",
          reportingType: "startEnd",
          active: true,
          createdAt: "2026-01-15T09:00:00.000Z",
          updatedAt: "2026-01-15T09:00:00.000Z",
          client: {
            id: 2,
            name: "Startup Ltd"
          }
        },
        {
          id: 4,
          name: "Database Migration",
          clientId: 2,
          projectManagerId: 1,
          startDate: "2026-02-01",
          endDate: null,
          description: "PostgreSQL migration",
          reportingType: "duration",
          active: true,
          createdAt: "2026-02-01T09:00:00.000Z",
          updatedAt: "2026-02-01T09:00:00.000Z",
          client: {
            id: 2,
            name: "Startup Ltd"
          }
        },
        {
          id: 5,
          name: "DevOps Setup",
          clientId: 3,
          projectManagerId: 1,
          startDate: "2026-01-10",
          endDate: null,
          description: "CI/CD pipeline setup",
          reportingType: "startEnd",
          active: true,
          createdAt: "2026-01-10T09:00:00.000Z",
          updatedAt: "2026-01-10T09:00:00.000Z",
          client: {
            id: 3,
            name: "Enterprise Inc"
          }
        }
      ];
    },
  });

  /**
   * Update project reporting type with optimistic updates
   * 
   * TODO: Remove mock mutation once backend endpoint is implemented by Member 3
   */
  const updateReportingTypeMutation = useMutation({
    mutationFn: async ({
      projectId,
      reportingType,
    }: {
      projectId: number;
      reportingType: ReportingType;
    }) => {
      // TEMPORARY MOCK - Replace with actual API call once backend is ready
      // Uncomment the line below when backend is implemented:
      // return await apiClient.patchProjectReportingType(projectId, reportingType);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock successful response
      console.log(`Mock: Updated project ${projectId} to reporting type: ${reportingType}`);
      return { success: true, data: { updated: true } } as any;
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
      // TODO: Uncomment when using real backend
      // queryClient.invalidateQueries({ queryKey });
      
      // With mock data, we don't need to invalidate because:
      // 1. There's no server state to sync
      // 2. Invalidation would overwrite our optimistic update with stale mock data
      // The optimistic update already reflects the change correctly
      console.log('Mock: Update successful (no refetch needed with mock data)');
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
