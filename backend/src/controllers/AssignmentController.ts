import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/AssignmentService';
import { ApiResponse } from '../utils/Response';
import {
  createAssignmentSchema,
  assignmentIdParamSchema,
} from '../validators/assignment.schema';

export class AssignmentController {
  static async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')
      const result = await AssignmentService.getAssignments();
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')
      const validated = createAssignmentSchema.parse(req.body);
      const result = await AssignmentService.createAssignment(validated);
      ApiResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')
      const { taskId, userId } = assignmentIdParamSchema.parse({ id: req.params.id });
      const result = await AssignmentService.deleteAssignment(taskId, userId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}


