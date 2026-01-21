/**
 * useProjectSelector Hook
 * Fetches and manages project selector data using TanStack Query
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjectSelector, buildTaskLookupMap } from '../services/projectSelectorApi';
import { ProjectSelectorData, ClientItem, TaskLookupMap } from '../types';
import { QUERY_KEYS } from '../utils/constants';

interface UseProjectSelectorParams {
  userId: string;
  enabled?: boolean;
}

interface UseProjectSelectorReturn {
  /** Full project selector data with hierarchy */
  data: ProjectSelectorData | undefined;
  /** Array of clients (shortcut to data.clients) */
  clients: ClientItem[];
  /** Memoized task lookup map for O(1) access */
  taskLookup: TaskLookupMap;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Refetch function */
  refetch: () => void;
  /** Is currently fetching (includes background refetches) */
  isFetching: boolean;
}

/**
 * Hook to fetch project selector data
 * Provides hierarchical client/project/task data and a flattened task lookup map
 * 
 * @param params - userId and optional enabled flag
 * @returns Project selector data, task lookup map, loading/error states, and refetch function
 * 
 * @example
 * const { clients, taskLookup, isLoading } = useProjectSelector({ userId: '123' });
 * 
 * // Access hierarchy
 * clients.forEach(client => {
 *   client.projects.forEach(project => {
 *     console.log(project.tasks);
 *   });
 * });
 * 
 * // Quick task lookup
 * const taskInfo = taskLookup.get(taskId);
 * console.log(taskInfo?.projectName, taskInfo?.reportingType);
 */
export function useProjectSelector({
  userId,
  enabled = true,
}: UseProjectSelectorParams): UseProjectSelectorReturn {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [QUERY_KEYS.projectSelector, userId],
    queryFn: () => getProjectSelector(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Memoize task lookup map to avoid rebuilding on every render
  const taskLookup = useMemo(() => {
    if (!data) {
      return new Map();
    }
    return buildTaskLookupMap(data);
  }, [data]);

  return {
    data,
    clients: data?.clients ?? [],
    taskLookup,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    isFetching,
  };
}
