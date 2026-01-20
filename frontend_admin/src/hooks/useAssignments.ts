import { useQuery } from '@tanstack/react-query';
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

const ASSIGNMENTS_QUERY_KEY = ['assignments'];

export function useAssignments() {
  const assignmentsQuery = useQuery({
    queryKey: ASSIGNMENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<Assignment[]>(`/admin/assignments`);
      return res.data;
    },
  });

  return {
    assignmentsQuery,
  };
}

