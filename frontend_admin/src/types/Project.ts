export type ReportingType = 'duration' | 'startEnd';

export interface Project {
  id: number | string; // Backend returns string IDs via toString()
  name: string;
  clientId: number | string; // Backend returns string IDs via toString()
  projectManagerId: number | string; // Backend returns string IDs via toString()
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  reportingType: ReportingType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
