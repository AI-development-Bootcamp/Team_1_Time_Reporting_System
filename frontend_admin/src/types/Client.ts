export interface Client {
  id: number | string; // Backend returns string IDs via serializeData, but we convert to number for consistency
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
