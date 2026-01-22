import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AssignmentService } from '../services/AssignmentService';
import { ApiResponse } from '../utils/Response';
import {
  createAssignmentSchema,
  assignmentIdParamSchema,
} from '../validators/assignment.schema';

export class AssignmentController {

  /**
   * GET /api/admin/assignments
   * List all user-task assignments
   */
  static async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AssignmentService.getAssignments();
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/assignments
   * Create assignment (TaskWorker)
   */
  static async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createAssignmentSchema.parse(req.body);
      const result = await AssignmentService.createAssignment(validated);
      ApiResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/assignments/:id
   * Delete assignment
   * id format: "taskId:userId"
   */
  static async deleteAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId, userId } = assignmentIdParamSchema.parse({ id: req.params.id });
      const result = await AssignmentService.deleteAssignment(taskId, userId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/assignments/:taskId/users
   * Get list of workers assigned to a specific task
   * Returns: [{ id: number, name: string }, ...]
   * Only returns active users
   */
  static async getTaskWorkers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ParamsSchema = z.object({
        taskId: z.string().regex(/^\d+$/).transform((s) => BigInt(s)),
      });

      const { taskId } = ParamsSchema.parse(req.params);

      // Get workers from service
      const workers = await AssignmentService.getTaskWorkers(taskId);

      ApiResponse.success(res, workers);
    } catch (error) {
      next(error);
    }
  }
}
