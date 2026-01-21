import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectSelector } from './useProjectSelector';
import * as projectSelectorApi from '../services/projectSelectorApi';
import { ProjectSelectorData } from '../types';

// Mock the API module
vi.mock('../services/projectSelectorApi');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockProjectSelectorData: ProjectSelectorData = {
  clients: [
    {
      id: 'client-1',
      name: 'Client A',
      reportCount: 10,
      projects: [
        {
          id: 'project-1',
          name: 'Project Alpha',
          reportingType: 'duration',
          reportCount: 5,
          tasks: [
            {
              id: 'task-1',
              name: 'Task 1',
              reportCount: 3,
            },
            {
              id: 'task-2',
              name: 'Task 2',
              reportCount: 2,
            },
          ],
        },
        {
          id: 'project-2',
          name: 'Project Beta',
          reportingType: 'startEnd',
          reportCount: 5,
          tasks: [
            {
              id: 'task-3',
              name: 'Task 3',
              reportCount: 5,
            },
          ],
        },
      ],
    },
    {
      id: 'client-2',
      name: 'Client B',
      reportCount: 8,
      projects: [
        {
          id: 'project-3',
          name: 'Project Gamma',
          reportingType: 'duration',
          reportCount: 8,
          tasks: [
            {
              id: 'task-4',
              name: 'Task 4',
              reportCount: 8,
            },
          ],
        },
      ],
    },
  ],
};

describe('useProjectSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches project selector data successfully', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockResolvedValue(mockProjectSelectorData);
    vi.mocked(projectSelectorApi.buildTaskLookupMap).mockImplementation((data) => {
      const map = new Map();
      data.clients.forEach((client) => {
        client.projects.forEach((project) => {
          project.tasks.forEach((task) => {
            map.set(task.id, {
              taskId: task.id,
              taskName: task.name,
              projectId: project.id,
              projectName: project.name,
              clientId: client.id,
              clientName: client.name,
              reportingType: project.reportingType,
            });
          });
        });
      });
      return map;
    });

    const { result } = renderHook(
      () => useProjectSelector({ userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check the data
    expect(result.current.data).toEqual(mockProjectSelectorData);
    expect(result.current.clients).toEqual(mockProjectSelectorData.clients);
    expect(result.current.clients).toHaveLength(2);
    expect(result.current.isError).toBe(false);
  });

  it('builds task lookup map correctly', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockResolvedValue(mockProjectSelectorData);
    vi.mocked(projectSelectorApi.buildTaskLookupMap).mockImplementation((data) => {
      const map = new Map();
      data.clients.forEach((client) => {
        client.projects.forEach((project) => {
          project.tasks.forEach((task) => {
            map.set(task.id, {
              taskId: task.id,
              taskName: task.name,
              projectId: project.id,
              projectName: project.name,
              clientId: client.id,
              clientName: client.name,
              reportingType: project.reportingType,
            });
          });
        });
      });
      return map;
    });

    const { result } = renderHook(
      () => useProjectSelector({ userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check task lookup map
    const taskLookup = result.current.taskLookup;
    expect(taskLookup.size).toBe(4); // 4 total tasks

    // Verify task-1 lookup
    const task1Info = taskLookup.get('task-1');
    expect(task1Info).toBeDefined();
    expect(task1Info?.taskName).toBe('Task 1');
    expect(task1Info?.projectName).toBe('Project Alpha');
    expect(task1Info?.clientName).toBe('Client A');
    expect(task1Info?.reportingType).toBe('duration');

    // Verify task-3 lookup (different project, startEnd type)
    const task3Info = taskLookup.get('task-3');
    expect(task3Info).toBeDefined();
    expect(task3Info?.taskName).toBe('Task 3');
    expect(task3Info?.projectName).toBe('Project Beta');
    expect(task3Info?.reportingType).toBe('startEnd');

    // Verify task-4 lookup (different client)
    const task4Info = taskLookup.get('task-4');
    expect(task4Info).toBeDefined();
    expect(task4Info?.clientName).toBe('Client B');
  });

  it('handles API error', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(
      () => useProjectSelector({ userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.clients).toEqual([]);
    expect(result.current.taskLookup.size).toBe(0);
  });

  it('does not fetch when disabled', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockResolvedValue(mockProjectSelectorData);

    const { result } = renderHook(
      () => useProjectSelector({ userId: 'user-1', enabled: false }),
      { wrapper: createWrapper() }
    );

    // Should not be loading when disabled
    expect(result.current.isLoading).toBe(false);
    expect(projectSelectorApi.getProjectSelector).not.toHaveBeenCalled();
  });

  it('does not fetch when userId is empty', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockResolvedValue(mockProjectSelectorData);

    const { result } = renderHook(
      () => useProjectSelector({ userId: '' }),
      { wrapper: createWrapper() }
    );

    // Should not be loading when userId is empty
    expect(result.current.isLoading).toBe(false);
    expect(projectSelectorApi.getProjectSelector).not.toHaveBeenCalled();
  });

  it('passes correct userId to API', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockResolvedValue(mockProjectSelectorData);

    renderHook(
      () => useProjectSelector({ userId: 'test-user-123' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(projectSelectorApi.getProjectSelector).toHaveBeenCalledWith('test-user-123');
    });
  });

  it('memoizes task lookup map', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockResolvedValue(mockProjectSelectorData);
    const buildMapSpy = vi.spyOn(projectSelectorApi, 'buildTaskLookupMap');

    const { result, rerender } = renderHook(
      () => useProjectSelector({ userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstTaskLookup = result.current.taskLookup;
    const buildMapCallCount = buildMapSpy.mock.calls.length;

    // Rerender without changing data
    rerender();

    // Task lookup should be the same reference (memoized)
    expect(result.current.taskLookup).toBe(firstTaskLookup);
    // buildTaskLookupMap should not be called again
    expect(buildMapSpy).toHaveBeenCalledTimes(buildMapCallCount);
  });

  it('returns empty map when data is undefined', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockResolvedValue(mockProjectSelectorData);

    const { result } = renderHook(
      () => useProjectSelector({ userId: 'user-1', enabled: false }),
      { wrapper: createWrapper() }
    );

    // Data is undefined when disabled
    expect(result.current.data).toBeUndefined();
    expect(result.current.taskLookup).toBeInstanceOf(Map);
    expect(result.current.taskLookup.size).toBe(0);
  });

  it('provides refetch function', async () => {
    vi.mocked(projectSelectorApi.getProjectSelector).mockResolvedValue(mockProjectSelectorData);

    const { result } = renderHook(
      () => useProjectSelector({ userId: 'user-1' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.refetch).toBeInstanceOf(Function);
    expect(result.current.isFetching).toBe(false);
  });
});
