import { prisma } from '../utils/prismaClient';
import { AppError } from '../middleware/ErrorHandler';

/**
 * AssignmentService - Handles task worker assignment operations
 */
export class AssignmentService {
    /**
     * Get all active workers assigned to a specific task
     */
    static async getTaskWorkers(taskId: bigint) {
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

        return workers;
    }
}
