import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/TaskService';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { createTaskSchema, updateTaskSchema, taskIdParamSchema, projectIdQuerySchema } from '../validators/task.schema';

export class TaskController {
  static async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')
      // For now, this endpoint is accessible without auth (will be secured by Member 1)

      // Query param: projectId (optional filter) - validate with Zod
      // Special case: "all" means no filter (show tasks from all projects)
      let projectIdFilter: bigint | undefined;
      if (req.query.projectId) {
        const projectIdValue = String(req.query.projectId);
        if (projectIdValue === 'all') {
          // "all" means no filter - don't set projectIdFilter
          projectIdFilter = undefined;
        } else {
          try {
            const queryValidation = projectIdQuerySchema.parse({ projectId: req.query.projectId });
            projectIdFilter = queryValidation.projectId;
          } catch (error) {
            throw new AppError('VALIDATION_ERROR', 'Invalid projectId parameter', 400);
          }
        }
      }

      // Query param: status (optional filter)
      // Default to 'open' if not specified (show only active/open tasks)
      // Options: 'open', 'closed', or 'all' to show all tasks
      let statusFilter: 'open' | 'closed' | 'all' | undefined;
      if (req.query.status === 'closed') {
        statusFilter = 'closed';
      } else if (req.query.status === 'all') {
        statusFilter = 'all'; // Show all tasks
      } else {
        statusFilter = 'open'; // Default to open tasks
      }

      const tasks = await TaskService.getTasks({ 
        projectId: projectIdFilter,
        status: statusFilter 
      });
      ApiResponse.success(res, tasks);
    } catch (error) {
      next(error);
    }
  }

  static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate request body
      const validatedData = createTaskSchema.parse(req.body);

      const result = await TaskService.createTask(validatedData);
      ApiResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate route parameter
      const { id: taskId } = taskIdParamSchema.parse({ id: req.params.id });

      // Validate request body
      const validatedData = updateTaskSchema.parse(req.body);

      const result = await TaskService.updateTask(taskId, validatedData);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate route parameter
      const { id: taskId } = taskIdParamSchema.parse({ id: req.params.id });

      const result = await TaskService.deleteTask(taskId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

