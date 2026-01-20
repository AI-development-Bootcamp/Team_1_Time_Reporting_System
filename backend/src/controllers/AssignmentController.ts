import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/AssignmentService';
import { ApiResponse } from '../utils/Response';

/**
 * AssignmentController - Handles task worker assignment HTTP requests
 */
export class AssignmentController {
    /**
     * GET /api/admin/assignments/:taskId/users
     * Get list of workers assigned to a specific task
     * Returns: [{ id: number, name: string }, ...]
     * Only returns active users
     */
    static async getTaskWorkers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const taskId = BigInt(req.params.taskId);

            // Get workers from service
            const workers = await AssignmentService.getTaskWorkers(taskId);

            ApiResponse.success(res, workers);
        } catch (error) {
            next(error);
        }
    }
}
