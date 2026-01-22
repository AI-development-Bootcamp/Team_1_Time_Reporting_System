import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/utils/ApiClient';
import { notifications } from '@mantine/notifications';
import { CreateUserInput, UpdateUserInput, ResetPasswordInput, User } from '../types/User';

const USERS_QUERY_KEY = ['users'];

export function useUsers(filters?: { active?: boolean; userType?: string }) {
  const queryClient = useQueryClient();

  // Build query params
  const queryParams = new URLSearchParams();
  if (filters?.active !== undefined) {
    queryParams.append('active', String(filters.active));
  }
  if (filters?.userType) {
    queryParams.append('userType', filters.userType);
  }

  // GET /api/admin/users
  const usersQuery = useQuery({
    queryKey: [...USERS_QUERY_KEY, filters],
    queryFn: async () => {
      const url = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await apiClient.get<User[]>(url);
      return res.data;
    },
  });

  // POST /api/admin/users
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await apiClient.post('/admin/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      notifications.show({
        title: 'הצלחה',
        message: 'המשתמש נוצר בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'שגיאה',
        message: error.response?.data?.error?.message || 'שגיאה ביצירת משתמש',
        color: 'red',
        autoClose: 3000,
      });
    },
  });

  // PUT /api/admin/users/:id
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserInput }) => {
      const response = await apiClient.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      notifications.show({
        title: 'הצלחה',
        message: 'המשתמש עודכן בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'שגיאה',
        message: error.response?.data?.error?.message || 'שגיאה בעדכון משתמש',
        color: 'red',
        autoClose: 3000,
      });
    },
  });

  // DELETE /api/admin/users/:id (soft delete)
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/admin/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      notifications.show({
        title: 'הצלחה',
        message: 'המשתמש נמחק בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'שגיאה',
        message: error.response?.data?.error?.message || 'שגיאה במחיקת משתמש',
        color: 'red',
        autoClose: 3000,
      });
    },
  });

  // POST /api/admin/users/:id/reset-password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ResetPasswordInput }) => {
      const response = await apiClient.post(`/admin/users/${id}/reset-password`, data);
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: 'הצלחה',
        message: 'הסיסמה אופסה בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'שגיאה',
        message: error.response?.data?.error?.message || 'שגיאה באיפוס סיסמה',
        color: 'red',
        autoClose: 3000,
      });
    },
  });

  return {
    usersQuery,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
    resetPasswordMutation,
  };
}

