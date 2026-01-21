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
    // Check if an active client with the same name already exists
    const existingActiveClient = await prisma.client.findFirst({
      where: {
        name: data.name,
        active: true,
      },
    });

    if (existingActiveClient) {
      throw new AppError('CONFLICT', 'Active client with this name already exists', 409);
    }

    // Create client (name can be reused if previous client with this name is inactive)
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

    // If name is being updated, ensure no other ACTIVE client has this name
    if (data.name !== undefined && data.name !== existingClient.name) {
      const existingActiveClientWithSameName = await prisma.client.findFirst({
        where: {
          name: data.name,
          active: true,
          // Exclude the current client from the uniqueness check
          NOT: { id },
        },
      });

      if (existingActiveClientWithSameName) {
        throw new AppError('CONFLICT', 'Active client with this name already exists', 409);
      }
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

    // Use a transaction to apply all cascading changes consistently
    await prisma.$transaction(async (tx) => {
      // 1) Soft delete the client (set active = false)
      await tx.client.update({
        where: { id },
        data: { active: false },
      });

      // 2) Soft delete all projects of this client (set active = false)
      await tx.project.updateMany({
        where: { clientId: id },
        data: { active: false },
      });

      // 3) Close all tasks that belong to projects of this client (set status = 'closed')
      await tx.task.updateMany({
        where: {
          project: {
            clientId: id,
          },
        },
        data: { status: 'closed' },
      });

      // 4) Delete all task-worker assignments for tasks under this client
      await tx.taskWorker.deleteMany({
        where: {
          task: {
            project: {
              clientId: id,
            },
          },
        },
      });
    });

    return serializeData({ deleted: true });
  }
}

