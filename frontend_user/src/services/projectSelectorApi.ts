/**
 * Project Selector API Service
 * Handles API calls for project selector data
 */

import { apiClient } from '@shared/utils/ApiClient';
import {
  ProjectSelectorData,
  TaskLookupMap,
  TaskLookupInfo,
  ClientItem,
} from '../types';

/**
 * Get project selector data for a user
 * Returns hierarchical structure: clients -> projects -> tasks
 * 
 * @param userId - User ID to get project selector for
 * @returns Project selector data with nested hierarchy
 */
export async function getProjectSelector(userId: string): Promise<ProjectSelectorData> {
  const response = await apiClient.get<ProjectSelectorData>('/projects/selector', {
    params: {
      userId,
    },
  });
  return response.data;
}

/**
 * Build a task lookup map from project selector data
 * Flattens the hierarchical structure for quick task lookups
 * 
 * @param data - Project selector data with nested hierarchy
 * @returns Map of taskId to TaskLookupInfo
 * 
 * @example
 * const selectorData = await getProjectSelector(userId);
 * const taskMap = buildTaskLookupMap(selectorData);
 * const taskInfo = taskMap.get(taskId); // Quick lookup
 */
export function buildTaskLookupMap(data: ProjectSelectorData): TaskLookupMap {
  const taskMap = new Map<string, TaskLookupInfo>();

  // Iterate through the hierarchy: clients -> projects -> tasks
  data.clients.forEach((client: ClientItem) => {
    client.projects.forEach((project) => {
      project.tasks.forEach((task) => {
        taskMap.set(task.id, {
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

  return taskMap;
}

// ============================================================================
// Export all functions as a namespace for cleaner imports
// ============================================================================

export const projectSelectorApi = {
  getProjectSelector,
  buildTaskLookupMap,
};
