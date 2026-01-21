import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/utils/ApiClient';
import { Client, CreateClientInput, UpdateClientInput } from '../types/Client';

const CLIENTS_QUERY_KEY = ['clients'];

export function useClients() {
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<Client[]>('/admin/clients');
      return res.data;
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (payload: CreateClientInput) => {
      const res = await apiClient.post<{ id: string }>('/admin/clients', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientInput }) => {
      const res = await apiClient.put<{ updated: boolean }>(`/admin/clients/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete<{ deleted: boolean }>(`/admin/clients/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });

  return {
    clientsQuery,
    createClientMutation,
    updateClientMutation,
    deleteClientMutation,
  };
}

