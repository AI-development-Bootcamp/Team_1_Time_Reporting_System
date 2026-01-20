import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/ErrorHandler';
import { serializeData } from '../utils/routeUtils';
import type { z } from 'zod';
import type { createAssignmentSchema } from '../validators/assignment.schema';

type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export class AssignmentService {
  static async createAssignment(data: CreateAssignmentInput) {
    // Validate that task and user exist before creating assignment
    // Include project and client to check their active status
    const [task, user] = await Promise.all([
      prisma.task.findUnique({
        where: { id: data.taskId },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      }),
      prisma.user.findUnique({ where: { id: data.userId } }),
    ]);

    if (!task) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // Prevent assignment to closed task
    if (task.status === 'closed') {
      throw new AppError('CONFLICT', 'Cannot assign user to a closed task', 409);
    }

    // Prevent assignment to task in inactive project
    if (!task.project.active) {
      throw new AppError('CONFLICT', 'Cannot assign user to a task in an inactive project', 409);
    }

    // Prevent assignment to task for inactive client
    if (!task.project.client.active) {
      throw new AppError('CONFLICT', 'Cannot assign user to a task for an inactive client', 409);
    }

    // Prevent duplicate assignment for same user-task pair
    const existing = await prisma.taskWorker.findUnique({
      where: {
        taskId_userId: {
          taskId: data.taskId,
          userId: data.userId,
        },
      },
    });

    if (existing) {
      throw new AppError('CONFLICT', 'Assignment already exists', 409);
    }

    try {
      const created = await prisma.taskWorker.create({
        data: {
          taskId: data.taskId,
          userId: data.userId,
        },
      });

      return serializeData({
        id: `${created.taskId}:${created.userId}`,
        taskId: created.taskId,
        userId: created.userId,
      });
    } catch (err: any) {
      // Extra safety: map foreign key errors to a clean NOT_FOUND response
      if (err.code === 'P2003') {
        throw new AppError(
          'NOT_FOUND',
          'Task or user not found for assignment',
          404,
        );
      }
      throw err;
    }
  }

  static async getAssignments() {
    const records = await prisma.taskWorker.findMany({
      include: {
        user: true,
        task: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    return serializeData(records);
  }

  static async deleteAssignment(taskId: bigint, userId: bigint) {
    // Ensure assignment exists
    const existing = await prisma.taskWorker.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Assignment not found', 404);
    }

    await prisma.taskWorker.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    return serializeData({ deleted: true });
  }
}


