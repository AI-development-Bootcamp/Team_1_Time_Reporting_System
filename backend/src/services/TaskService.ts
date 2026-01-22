import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/ErrorHandler';
import { serializeData, parseDateString } from '../utils/routeUtils';
import type { TaskStatus } from '@prisma/client';
import type { z } from 'zod';
import type { createTaskSchema, updateTaskSchema } from '../validators/task.schema';

type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export class TaskService {
  static async getTasks(filters: { projectId?: bigint; status?: 'open' | 'closed' | 'all' }) {
    let statusFilter: 'open' | 'closed' | undefined;
    if (filters.status === 'closed') {
      statusFilter = 'closed';
    } else if (filters.status === 'all') {
      statusFilter = undefined; // Show all tasks
    } else {
      statusFilter = 'open'; // Default to open tasks
    }

    const tasks = await prisma.task.findMany({
      where: {
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(statusFilter && { status: statusFilter }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return serializeData(tasks);
  }

  static async createTask(data: CreateTaskInput) {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        startDate: data.startDate ? parseDateString(data.startDate) : null,
        endDate: data.endDate ? parseDateString(data.endDate) : null,
        description: data.description,
        status: (data.status || 'open') as TaskStatus,
      },
    });

    return serializeData({ id: task.id });
  }

  static async updateTask(id: bigint, data: UpdateTaskInput) {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    // Prepare update data (only include fields that are provided)
    const updateData: {
      name?: string;
      projectId?: bigint;
      startDate?: Date | null;
      endDate?: Date | null;
      description?: string | null;
      status?: TaskStatus;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.projectId !== undefined) {
      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project) {
        throw new AppError('NOT_FOUND', 'Project not found', 404);
      }
      updateData.projectId = data.projectId;
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? parseDateString(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? parseDateString(data.endDate) : null;
    }
    if (data.description !== undefined) {
      updateData.description = data.description ?? null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status as TaskStatus;
    }

    // If status is being set to 'closed', close task and delete assignments in a transaction
    if (updateData.status === 'closed') {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id },
          data: updateData,
        });

        await tx.taskWorker.deleteMany({
          where: { taskId: id },
        });
      });

      return serializeData({ updated: true });
    }

    // Regular update when status is not being changed to 'closed'
    await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return serializeData({ updated: true });
  }

  static async deleteTask(id: bigint) {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    // Use a transaction: close task and delete assignments together
    await prisma.$transaction(async (tx) => {
      // 1) Soft delete: set status to 'closed'
      await tx.task.update({
        where: { id },
        data: { status: 'closed' as TaskStatus },
      });

      // 2) Delete all task-worker assignments for this task
      await tx.taskWorker.deleteMany({
        where: { taskId: id },
      });
    });

    return serializeData({ deleted: true });
  }
}

