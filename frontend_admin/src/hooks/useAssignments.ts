import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/utils/ApiClient';

export interface Assignment {
  id: string;
  taskId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    mail: string;
  };
  task?: {
    id: string;
    name: string;
    projectId: string;
    project?: {
      id: string;
      name: string;
      clientId: string;
      client?: {
        id: string;
        name: string;
      };
    };
  };
}

export const ASSIGNMENTS_QUERY_KEY = ['assignments'];

export function useAssignments() {
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ASSIGNMENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<Assignment[]>(`/admin/assignments`);
      return res.data;
    },
  });

  const deleteAssignmentsMutation = useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      await Promise.all(
        userIds.map((userId) =>
          apiClient.delete(`/admin/assignments/${taskId}:${userId}`)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_QUERY_KEY });
    },
  });

  return {
    assignmentsQuery,
    deleteAssignmentsMutation,
  };
}

