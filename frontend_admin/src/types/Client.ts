export interface Client {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
