import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/ProjectService';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { createProjectSchema, updateProjectSchema, projectIdParamSchema, clientIdQuerySchema } from '../validators/project.schema';

export class ProjectController {
  static async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')
      // For now, this endpoint is accessible without auth (will be secured by Member 1)

      // Query param: clientId (optional filter) - validate with Zod
      let clientIdFilter: bigint | undefined;
      if (req.query.clientId) {
        try {
          const queryValidation = clientIdQuerySchema.parse({ clientId: req.query.clientId });
          clientIdFilter = queryValidation.clientId;
        } catch (error) {
          throw new AppError('VALIDATION_ERROR', 'Invalid clientId parameter', 400);
        }
      }

      // Query param: active (boolean, optional)
      // Default to true if not specified (show only active projects)
      const activeFilter =
        req.query.active !== undefined
          ? req.query.active === 'true'
          : true;

      const projects = await ProjectService.getProjects({ 
        clientId: clientIdFilter,
        active: activeFilter 
      });
      ApiResponse.success(res, projects);
    } catch (error) {
      next(error);
    }
  }

  static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate request body
      const validatedData = createProjectSchema.parse(req.body);

      const result = await ProjectService.createProject(validatedData);
      ApiResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate route parameter
      const { id: projectId } = projectIdParamSchema.parse({ id: req.params.id });

      // Validate request body
      const validatedData = updateProjectSchema.parse(req.body);

      const result = await ProjectService.updateProject(projectId, validatedData);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async toggleReportingType(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate route parameter
      const { id: projectId } = projectIdParamSchema.parse({ id: req.params.id });

      const result = await ProjectService.toggleReportingType(projectId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate route parameter
      const { id: projectId } = projectIdParamSchema.parse({ id: req.params.id });

      const result = await ProjectService.deleteProject(projectId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

