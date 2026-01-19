import { apiClient as sharedApiClient } from '@shared/utils/ApiClient';
import type { ReportingType } from '../types/Project';

/**
 * Extended API client for admin-specific endpoints
 * Wraps the shared ApiClient and adds admin-specific methods
 */
class AdminApiClient {
  /**
   * Update project reporting type
   * @param projectId - The ID of the project to update
   * @param reportingType - The new reporting type ('duration' | 'startEnd')
   */
  async patchProjectReportingType(
    projectId: number,
    reportingType: ReportingType
  ) {
    return sharedApiClient.patch<{ updated: boolean }>(
      `/admin/projects/${projectId}`,
      { reportingType }
    );
  }
}

export const apiClient = new AdminApiClient();
