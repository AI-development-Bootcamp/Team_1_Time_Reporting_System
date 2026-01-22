export interface Client {
  id: number | string; // Backend returns string IDs via serializeData, but we convert to number for consistency
  name: string;
  description?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  description?: string;
}

export interface UpdateClientInput {
  name?: string;
  description?: string;
  active?: boolean;
}