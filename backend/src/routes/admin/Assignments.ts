import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prismaClient';
import { ApiResponse } from '../../utils/Response';
import { AppError } from '../../middleware/ErrorHandler';
import { authMiddleware } from '../Auth';
import { adminMiddleware } from '../../middleware/Admin';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/assignments/:taskId/users
 * Get list of workers assigned to a specific task
 * Returns: [{ id: number, name: string }, ...]
 * Only returns active users
 */
router.get('/assignments/:taskId/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = BigInt(req.params.taskId);

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new AppError('NOT_FOUND', 'Task not found', 404);
    }

    // Get all workers assigned to this task (only active users)
    const assignments = await prisma.taskWorker.findMany({
      where: { 
        taskId: taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    });

    // Filter only active users and format response
    const workers = assignments
      .filter((assignment) => assignment.user.active)
      .map((assignment) => ({
        id: Number(assignment.user.id),
        name: assignment.user.name,
      }));

    ApiResponse.success(res, workers);
  } catch (error) {
    next(error);
  }
});

export default router;
