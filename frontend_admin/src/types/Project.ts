export interface CreateProjectInput {
  name: string;
  clientId: string;
  projectManagerId: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  description?: string;
}


