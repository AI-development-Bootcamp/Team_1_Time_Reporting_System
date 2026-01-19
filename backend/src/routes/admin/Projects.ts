import { Router, Request, Response } from 'express';
import { PrismaClient, ReportingType, Project } from '@prisma/client';
import { z } from 'zod';
import { ApiResponse } from '../../utils/Response';
import { AppError } from '../../middleware/ErrorHandler';
import { asyncHandler, bigIntIdSchema, optionalBigIntIdSchema, parseDateString } from '../../utils/routeUtils';

const router = Router();
const prisma = new PrismaClient();

// Zod schemas for validation
const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: bigIntIdSchema,
  projectManagerId: bigIntIdSchema,
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  description: z.string().optional(),
  // Optional, defaults to startEnd in DB
  reportingType: z.enum(['duration', 'startEnd']).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  clientId: optionalBigIntIdSchema,
  projectManagerId: optionalBigIntIdSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  description: z.string().nullable().optional(),
  reportingType: z.enum(['duration', 'startEnd']).optional(),
  active: z.boolean().optional(),
});

// Schema for validating route parameters
const projectIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(val => BigInt(val)),
});

// Schema for validating query parameters
const clientIdQuerySchema = z.object({
  clientId: z.string().regex(/^\d+$/, 'Client ID must be a valid number').transform(val => BigInt(val)).optional(),
});

// Helper to convert a Project entity into a JSON-safe response object
function mapProjectToResponse(project: Project) {
  return {
    id: Number(project.id),
    name: project.name,
    clientId: Number(project.clientId),
    projectManagerId: Number(project.projectManagerId),
    startDate: project.startDate.toISOString().slice(0, 10), // YYYY-MM-DD
    endDate: project.endDate ? project.endDate.toISOString().slice(0, 10) : null,
    description: project.description,
    reportingType: project.reportingType as ReportingType,
    active: project.active,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

/**
 * GET /api/admin/projects
 * List projects (optional filter by clientId and active status)
 * Auth: Required, Role: admin
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
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

    const projects = await prisma.project.findMany({
      where: {
        ...(clientIdFilter && { clientId: clientIdFilter }),
        active: activeFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const responseData = projects.map(mapProjectToResponse);
    ApiResponse.success(res, responseData);
  }),
);

/**
 * POST /api/admin/projects
 * Create project
 * Auth: Required, Role: admin
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Add admin auth middleware check (userType === 'admin')

    // Validate request body
    const validatedData = createProjectSchema.parse(req.body);

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
    });

    if (!client) {
      throw new AppError('NOT_FOUND', 'Client not found', 404);
    }

    // Check if project manager exists
    const projectManager = await prisma.user.findUnique({
      where: { id: validatedData.projectManagerId },
    });

    if (!projectManager) {
      throw new AppError('NOT_FOUND', 'Project manager not found', 404);
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        clientId: validatedData.clientId,
        projectManagerId: validatedData.projectManagerId,
        startDate: parseDateString(validatedData.startDate),
        endDate: validatedData.endDate
          ? parseDateString(validatedData.endDate)
          : null,
        description: validatedData.description,
        // Default to startEnd if not provided
        reportingType: (validatedData.reportingType || 'startEnd') as ReportingType,
        // New projects are active by default
        active: true,
      },
    });

    ApiResponse.success(res, { id: Number(project.id) }, 201);
  }),
);

/**
 * PUT /api/admin/projects/:id
 * Update project
 * Auth: Required, Role: admin
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Add admin auth middleware check (userType === 'admin')

    // Validate route parameter
    const { id: projectId } = projectIdParamSchema.parse({ id: req.params.id });

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    // Validate request body
    const validatedData = updateProjectSchema.parse(req.body);

    // Prepare update data (only include fields that are provided)
    const updateData: {
      name?: string;
      clientId?: bigint;
      projectManagerId?: bigint;
      startDate?: Date;
      endDate?: Date | null;
      description?: string | null;
      reportingType?: ReportingType;
      active?: boolean;
    } = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.clientId !== undefined) {
      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: validatedData.clientId },
      });
      if (!client) {
        throw new AppError('NOT_FOUND', 'Client not found', 404);
      }
      updateData.clientId = validatedData.clientId;
    }
    if (validatedData.projectManagerId !== undefined) {
      // Verify project manager exists
      const projectManager = await prisma.user.findUnique({
        where: { id: validatedData.projectManagerId },
      });
      if (!projectManager) {
        throw new AppError('NOT_FOUND', 'Project manager not found', 404);
      }
      updateData.projectManagerId = validatedData.projectManagerId;
    }
    if (validatedData.startDate !== undefined) {
      updateData.startDate = parseDateString(validatedData.startDate);
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate
        ? parseDateString(validatedData.endDate)
        : null;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description ?? null;
    }
    if (validatedData.reportingType !== undefined) {
      updateData.reportingType = validatedData.reportingType as ReportingType;
    }
    if (validatedData.active !== undefined) {
      updateData.active = validatedData.active;
    }

    // Update project
    await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    ApiResponse.success(res, { updated: true });
  }),
);

/**
 * PATCH /api/admin/projects/:id
 * Toggle reportingType between 'startEnd' and 'duration'
 * Auth: Required, Role: admin
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Add admin auth middleware check (userType === 'admin')

    // Validate route parameter
    const { id: projectId } = projectIdParamSchema.parse({ id: req.params.id });

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    // Toggle reportingType: if startEnd -> duration, if duration -> startEnd
    const newReportingType: ReportingType =
      existingProject.reportingType === 'startEnd' ? 'duration' : 'startEnd';

    // Update only the reportingType field
    await prisma.project.update({
      where: { id: projectId },
      data: { reportingType: newReportingType },
    });

    ApiResponse.success(res, {
      updated: true,
      reportingType: newReportingType,
    });
  }),
);

/**
 * DELETE /api/admin/projects/:id
 * Soft delete project (set active=false)
 * Auth: Required, Role: admin
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Add admin auth middleware check (userType === 'admin')

    // Validate route parameter
    const { id: projectId } = projectIdParamSchema.parse({ id: req.params.id });

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    // Soft delete: set active = false
    await prisma.project.update({
      where: { id: projectId },
      data: { active: false },
    });

    ApiResponse.success(res, { deleted: true });
  }),
);

export default router;


