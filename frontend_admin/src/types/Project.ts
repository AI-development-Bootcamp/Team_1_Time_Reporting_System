export interface CreateProjectInput {
  name: string;
  clientId: string;
  projectManagerId: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  description?: string;
}


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
