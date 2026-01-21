import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useReportingSettings } from './useReportingSettings';
import { projectService } from '../services/ProjectService';
import { clientService } from '../services/ClientService';
import type { Project } from '../types/Project';
import type { Client } from '../types/Client';

// Mock the services
vi.mock('../services/ProjectService');
vi.mock('../services/ClientService');

const mockProjectService = vi.mocked(projectService);
const mockClientService = vi.mocked(clientService);

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Project 1',
    clientId: 1,
    projectManagerId: 1,
    startDate: dayjs('2024-01-01').toISOString(),
    endDate: null,
    reportingType: 'startEnd',
    active: true,
    createdAt: dayjs('2024-01-01').toISOString(),
    updatedAt: dayjs('2024-01-01').toISOString(),
  },
  {
    id: 2,
    name: 'Project 2',
    clientId: 2,
    projectManagerId: 2,
    startDate: dayjs('2024-01-02').toISOString(),
    endDate: null,
    reportingType: 'duration',
    active: true,
    createdAt: dayjs('2024-01-02').toISOString(),
    updatedAt: dayjs('2024-01-02').toISOString(),
  },
];

const mockClients: Client[] = [
  {
    id: 1,
    name: 'Client 1',
    active: true,
    createdAt: dayjs('2024-01-01').toISOString(),
    updatedAt: dayjs('2024-01-01').toISOString(),
  },
  {
    id: 2,
    name: 'Client 2',
    active: true,
    createdAt: dayjs('2024-01-02').toISOString(),
    updatedAt: dayjs('2024-01-02').toISOString(),
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        // Disable refetch on window focus for tests
        refetchOnWindowFocus: false,
        // Reduce stale time for tests
        staleTime: 0,
      },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useReportingSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and joins projects with clients', async () => {
    mockProjectService.getProjects.mockResolvedValue(mockProjects);
    mockClientService.getClients.mockResolvedValue(mockClients);

    const { result } = renderHook(() => useReportingSettings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects[0]).toMatchObject({
      id: 1,
      name: 'Project 1',
      client: {
        id: 1,
        name: 'Client 1',
      },
    });
    expect(result.current.projects[1]).toMatchObject({
      id: 2,
      name: 'Project 2',
      client: {
        id: 2,
        name: 'Client 2',
      },
    });
  });

  it('handles missing client data gracefully', async () => {
    const projectsWithoutMatchingClient = [
      {
        ...mockProjects[0],
        clientId: 999, // Non-existent client
      },
    ];

    mockProjectService.getProjects.mockResolvedValue(projectsWithoutMatchingClient);
    mockClientService.getClients.mockResolvedValue(mockClients);

    const { result } = renderHook(() => useReportingSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects[0].client.name).toBe('Unknown Client');
  });

  it('handles error state', async () => {
    mockProjectService.getProjects.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useReportingSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBeDefined();
  });

  it('updates reporting type optimistically', async () => {
    mockProjectService.getProjects.mockResolvedValue(mockProjects);
    mockClientService.getClients.mockResolvedValue(mockClients);
    // Make the mutation take a bit of time so we can observe the optimistic update
    let resolveMutation: ((value: { updated: boolean }) => void) | undefined;
    const mutationPromise = new Promise<{ updated: boolean }>((resolve) => {
      resolveMutation = resolve;
    });
    mockProjectService.updateReportingType.mockImplementation(() => mutationPromise);

    const { result } = renderHook(() => useReportingSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initially, first project has startEnd
    expect(result.current.projects[0].reportingType).toBe('startEnd');

    // Update reporting type - optimistic update should happen in onMutate
    // onMutate is async but setQueryData should update query data synchronously after cancelQueries
    await act(async () => {
      result.current.updateReportingType(
        { projectId: 1, reportingType: 'duration' },
        {
          onSuccess: () => {},
          onError: () => {},
        }
      );
      // Give onMutate a moment to complete (it's async)
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // The optimistic update happens in onMutate which:
    // 1. Calls await queryClient.cancelQueries (async) - this completes first
    // 2. Calls queryClient.setQueryData (synchronous) - this updates the cache
    // React Query should notify subscribers and trigger re-render
    // The optimistic update should appear before the mutation completes
    await waitFor(() => {
      const projects = result.current.projects;
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]?.reportingType).toBe('duration');
    }, { timeout: 5000 });

    // Verify the service was called
    expect(mockProjectService.updateReportingType).toHaveBeenCalledWith(1, 'duration');

    // Update mock to return updated data (simulating backend update)
    const updatedProjects = mockProjects.map(p => 
      p.id === 1 ? { ...p, reportingType: 'duration' as const } : p
    );
    mockProjectService.getProjects.mockResolvedValue(updatedProjects);

    // Resolve the mutation to allow it to complete
    if (resolveMutation) {
      resolveMutation({ updated: true });
    }

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isUpdating).toBe(false);
    }, { timeout: 3000 });

    // Verify the update persisted (after refetch, it should still be 'duration')
    await waitFor(() => {
      expect(result.current.projects[0]?.reportingType).toBe('duration');
    }, { timeout: 3000 });
  });

  it('rolls back on update error', async () => {
    mockProjectService.getProjects.mockResolvedValue(mockProjects);
    mockClientService.getClients.mockResolvedValue(mockClients);
    mockProjectService.updateReportingType.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useReportingSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const originalType = result.current.projects[0].reportingType;

    // Attempt to update
    result.current.updateReportingType(
      { projectId: 1, reportingType: 'duration' },
      {
        onSuccess: () => {},
        onError: () => {},
      }
    );

    // Wait for the mutation to complete (and rollback)
    await waitFor(() => {
      expect(result.current.isUpdating).toBe(false);
    }, { timeout: 3000 });

    // Should rollback to original value
    expect(result.current.projects[0].reportingType).toBe(originalType);
  });

  it('provides refetch function', async () => {
    mockProjectService.getProjects.mockResolvedValue(mockProjects);
    mockClientService.getClients.mockResolvedValue(mockClients);

    const { result } = renderHook(() => useReportingSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');

    // Call refetch
    await result.current.refetch();

    expect(mockProjectService.getProjects).toHaveBeenCalledTimes(2);
    expect(mockClientService.getClients).toHaveBeenCalledTimes(2);
  });
});
