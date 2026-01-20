import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/ErrorHandler';
import { serializeData } from '../utils/routeUtils';
import type { z } from 'zod';
import type { createClientSchema, updateClientSchema } from '../validators/client.schema';

type CreateClientInput = z.infer<typeof createClientSchema>;
type UpdateClientInput = z.infer<typeof updateClientSchema>;

export class ClientService {
  static async getClients(filters: { active?: boolean }) {
    const activeFilter = filters.active !== undefined ? filters.active : true;

    const clients = await prisma.client.findMany({
      where: {
        active: activeFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return serializeData(clients);
  }

  static async createClient(data: CreateClientInput) {
    // Check if client with same name already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingClient) {
      throw new AppError('CONFLICT', 'Client with this name already exists', 409);
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name: data.name,
        description: data.description,
        active: true, // New clients are active by default
      },
    });

    return serializeData({ id: client.id });
  }

  static async updateClient(id: bigint, data: UpdateClientInput) {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new AppError('NOT_FOUND', 'Client not found', 404);
    }

    // Prepare update data (only include fields that are provided)
    const updateData: {
      name?: string;
      description?: string | null;
      active?: boolean;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description ?? null;
    }
    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    // Update client
    await prisma.client.update({
      where: { id },
      data: updateData,
    });

    return serializeData({ updated: true });
  }

  static async deleteClient(id: bigint) {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new AppError('NOT_FOUND', 'Client not found', 404);
    }

    // Soft delete: set active = false
    await prisma.client.update({
      where: { id },
      data: { active: false },
    });

    return serializeData({ deleted: true });
  }
}

