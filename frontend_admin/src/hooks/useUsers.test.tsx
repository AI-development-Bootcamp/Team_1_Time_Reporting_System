import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers } from './useUsers';
import { apiClient } from '@shared/utils/ApiClient';
import type { User } from '../types/User';

// Mock the apiClient
vi.mock('@shared/utils/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

// Mock user data matching backend API response structure
const mockUsers: User[] = [
  {
    id: 1,
    name: 'John Doe',
    mail: 'john@example.com',
    userType: 'admin',
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    mail: 'jane@example.com',
    userType: 'worker',
    active: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Bob Wilson',
    mail: 'bob@example.com',
    userType: 'worker',
    active: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches users successfully', async () => {
    // Mock API response matching backend structure: { success: true, data: User[] }
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockUsers,
    });

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    expect(result.current.usersQuery.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.usersQuery.isLoading).toBe(false);
    });

    expect(result.current.usersQuery.data).toEqual(mockUsers);
    expect(result.current.usersQuery.data).toHaveLength(3);
    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/users');
  });

  it('fetches users with active filter', async () => {
    const activeUsers = mockUsers.filter((u) => u.active);
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: activeUsers,
    });

    const { result } = renderHook(() => useUsers({ active: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.usersQuery.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/users?active=true');
    expect(result.current.usersQuery.data).toEqual(activeUsers);
  });

  it('fetches users with userType filter', async () => {
    const workerUsers = mockUsers.filter((u) => u.userType === 'worker');
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: workerUsers,
    });

    const { result } = renderHook(() => useUsers({ userType: 'worker' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.usersQuery.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/users?userType=worker');
    expect(result.current.usersQuery.data).toEqual(workerUsers);
  });

  it('creates a user successfully', async () => {
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockUsers,
    });

    const newUser = {
      name: 'New User',
      mail: 'newuser@example.com',
      password: 'Password123!',
      userType: 'worker' as const,
    };

    // Mock create response matching backend: { success: true, data: { id: 4 } }
    mockApiClient.post.mockResolvedValue({
      success: true,
      data: { id: 4 },
    });

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.usersQuery.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createUserMutation.mutateAsync(newUser);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/admin/users', newUser);
  });

  it('updates a user successfully', async () => {
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockUsers,
    });

    const updateData = {
      name: 'Updated Name',
      mail: 'updated@example.com',
    };

    // Mock update response matching backend: { success: true, data: { updated: true } }
    mockApiClient.put.mockResolvedValue({
      success: true,
      data: { updated: true },
    });

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.usersQuery.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateUserMutation.mutateAsync({
        id: 1,
        data: updateData,
      });
    });

    expect(mockApiClient.put).toHaveBeenCalledWith('/admin/users/1', updateData);
  });

  it('deletes a user successfully', async () => {
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockUsers,
    });

    // Mock delete response matching backend: { success: true, data: { deleted: true } }
    mockApiClient.delete.mockResolvedValue({
      success: true,
      data: { deleted: true },
    });

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.usersQuery.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteUserMutation.mutateAsync(1);
    });

    expect(mockApiClient.delete).toHaveBeenCalledWith('/admin/users/1');
  });

  it('resets user password successfully', async () => {
    mockApiClient.get.mockResolvedValue({
      success: true,
      data: mockUsers,
    });

    // Mock reset password response matching backend: { success: true, data: { updated: true } }
    mockApiClient.post.mockResolvedValue({
      success: true,
      data: { updated: true },
    });

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.usersQuery.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.resetPasswordMutation.mutateAsync({
        id: 1,
        data: { newPassword: 'NewPassword123!' },
      });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/admin/users/1/reset-password', {
      newPassword: 'NewPassword123!',
    });
  });
});
