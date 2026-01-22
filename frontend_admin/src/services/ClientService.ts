import { apiClient } from '@shared/utils/ApiClient';
import type { Client } from '../types/Client';

/**
 * Service layer for Client-related API calls
 * Centralizes all client-related HTTP requests
 */
export class ClientService {
  /**
   * Fetch all clients
   * Backend is responsible for filtering (e.g., active clients only)
   */
  async getClients(): Promise<Client[]> {
    const response = await apiClient.get<Client[]>('/admin/clients');
    return response.data;
  }

  /**
   * Fetch a single client by ID
   */
  async getClientById(clientId: number): Promise<Client> {
    const response = await apiClient.get<Client>(`/admin/clients/${clientId}`);
    return response.data;
  }

  /**
   * Create a new client
   */
  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const response = await apiClient.post<Client>('/admin/clients', client);
    return response.data;
  }

  /**
   * Update client details
   */
  async updateClient(clientId: number, updates: Partial<Client>): Promise<Client> {
    const response = await apiClient.put<Client>(`/admin/clients/${clientId}`, updates);
    return response.data;
  }

  /**
   * Soft delete a client (set active = false)
   */
  async deleteClient(clientId: number): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/admin/clients/${clientId}`);
    return response.data;
  }
}

export const clientService = new ClientService();
