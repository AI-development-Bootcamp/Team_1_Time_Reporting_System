import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/utils/ApiClient';

export interface User {
  id: string;
  name: string;
  mail: string;
  userType: 'worker' | 'admin';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const USERS_QUERY_KEY = ['users'];

export function useUsers() {
  const usersQuery = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<User[]>('/admin/users');
      return res.data;
    },
  });

  return {
    usersQuery,
  };
}

