/**
 * ProjectSelector Types
 * Matches backend API response from /api/projects/selector
 */

/**
 * Task item in project selector
 */
export interface TaskItem {
  id: string;
  name: string;
  reportCount: number;
}

/**
 * Project item with nested tasks
 */
export interface ProjectItem {
  id: string;
  name: string;
  reportingType: 'duration' | 'startEnd';
  reportCount: number;
  tasks: TaskItem[];
}

/**
 * Client item with nested projects
 */
export interface ClientItem {
  id: string;
  name: string;
  reportCount: number;
  projects: ProjectItem[];
}

/**
 * Project selector response data
 */
export interface ProjectSelectorData {
  clients: ClientItem[];
}

/**
 * API response wrapper for project selector
 */
export interface ProjectSelectorResponse {
  success: true;
  data: ProjectSelectorData;
}

/**
 * Task info for quick lookup (flattened from selector)
 */
export interface TaskLookupInfo {
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  reportingType: 'duration' | 'startEnd';
}

/**
 * Map of taskId to task info for quick lookup
 */
export type TaskLookupMap = Map<string, TaskLookupInfo>;
