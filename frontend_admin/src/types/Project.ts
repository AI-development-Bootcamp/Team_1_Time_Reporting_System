export type ReportingType = 'duration' | 'startEnd';

export interface Project {
  id: number;
  name: string;
  clientId: number;
  projectManagerId: number;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  reportingType: ReportingType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
