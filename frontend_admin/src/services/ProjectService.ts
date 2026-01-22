import { apiClient } from '@shared/utils/ApiClient';
import type { Project, ReportingType } from '../types/Project';

/**
 * Service layer for Project-related API calls
 * Centralizes all project-related HTTP requests
 */
export class ProjectService {
  /**
   * Fetch all projects
   * Backend is responsible for filtering (e.g., active projects only)
   */
  async getProjects(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/admin/projects');
    return response.data;
  }

  /**
   * Fetch a single project by ID
   */
  async getProjectById(projectId: number): Promise<Project> {
    const response = await apiClient.get<Project>(`/admin/projects/${projectId}`);
    return response.data;
  }

  /**
   * Update project reporting type
   * @param projectId - The ID of the project to update
   * @param reportingType - The new reporting type ('duration' | 'startEnd')
   */
  async updateReportingType(
    projectId: number,
    reportingType: ReportingType
  ): Promise<{ updated: boolean }> {
    const response = await apiClient.patch<{ updated: boolean }>(
      `/admin/projects/${projectId}`,
      { reportingType }
    );
    return response.data;
  }

  /**
   * Create a new project
   */
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const response = await apiClient.post<Project>('/admin/projects', project);
    return response.data;
  }

  /**
   * Update project details
   */
  async updateProject(projectId: number, updates: Partial<Project>): Promise<Project> {
    const response = await apiClient.put<Project>(`/admin/projects/${projectId}`, updates);
    return response.data;
  }

  /**
   * Soft delete a project (set active = false)
   */
  async deleteProject(projectId: number): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/admin/projects/${projectId}`);
    return response.data;
  }
}

export const projectService = new ProjectService();
