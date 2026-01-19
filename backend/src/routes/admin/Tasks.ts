import { Router, Request, Response } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { ApiResponse } from '../../utils/Response';
import { AppError } from '../../middleware/ErrorHandler';
import { asyncHandler, serializeData, bigIntIdSchema, optionalBigIntIdSchema, parseDateString } from '../../utils/routeUtils';

const router = Router();
const prisma = new PrismaClient();

// Zod schemas for validation
const createTaskSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  projectId: bigIntIdSchema,
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  description: z.string().optional(),
  status: z.enum(['open', 'closed']).default('open'),
});

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  projectId: optionalBigIntIdSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  description: z.string().nullable().optional(),
  status: z.enum(['open', 'closed']).optional(),
});

// Schema for validating route parameters
const taskIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(val => BigInt(val)),
});

// Schema for validating query parameters
const projectIdQuerySchema = z.object({
  projectId: z.string().regex(/^\d+$/, 'Project ID must be a valid number').transform(val => BigInt(val)).optional(),
});

/**
 * GET /api/admin/tasks
 * List tasks (optional filter by projectId and status)
 * Auth: Required, Role: admin
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')
  // For now, this endpoint is accessible without auth (will be secured by Member 1)

  // Query param: projectId (optional filter) - validate with Zod
  let projectIdFilter: bigint | undefined;
  if (req.query.projectId) {
    try {
      const queryValidation = projectIdQuerySchema.parse({ projectId: req.query.projectId });
      projectIdFilter = queryValidation.projectId;
    } catch (error) {
      throw new AppError('VALIDATION_ERROR', 'Invalid projectId parameter', 400);
    }
  }

  // Query param: status (optional filter)
  // Default to 'open' if not specified (show only active/open tasks)
  // Options: 'open', 'closed', or 'all' to show all tasks
  let statusFilter: 'open' | 'closed' | undefined;
  if (req.query.status === 'closed') {
    statusFilter = 'closed';
  } else if (req.query.status === 'all') {
    statusFilter = undefined; // Show all tasks
  } else {
    statusFilter = 'open'; // Default to open tasks
  }

  const tasks = await prisma.task.findMany({
    where: {
      ...(projectIdFilter && { projectId: projectIdFilter }),
      ...(statusFilter && { status: statusFilter }),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  ApiResponse.success(res, serializeData(tasks));
}));

/**
 * POST /api/admin/tasks
 * Create task
 * Auth: Required, Role: admin
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')

  // Validate request body
  const validatedData = createTaskSchema.parse(req.body);

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: validatedData.projectId },
  });

  if (!project) {
    throw new AppError('NOT_FOUND', 'Project not found', 404);
  }

  // Create task
  const task = await prisma.task.create({
    data: {
      name: validatedData.name,
      projectId: validatedData.projectId,
      startDate: validatedData.startDate ? parseDateString(validatedData.startDate) : null,
      endDate: validatedData.endDate ? parseDateString(validatedData.endDate) : null,
      description: validatedData.description,
      status: (validatedData.status || 'open') as TaskStatus,
    },
  });

  ApiResponse.success(res, serializeData({ id: task.id }), 201);
}));

/**
 * PUT /api/admin/tasks/:id
 * Update task
 * Auth: Required, Role: admin
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')

  // Validate route parameter
  const { id: taskId } = taskIdParamSchema.parse({ id: req.params.id });

  // Check if task exists
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!existingTask) {
    throw new AppError('NOT_FOUND', 'Task not found', 404);
  }

  // Validate request body
  const validatedData = updateTaskSchema.parse(req.body);

  // Prepare update data (only include fields that are provided)
  const updateData: {
    name?: string;
    projectId?: bigint;
    startDate?: Date | null;
    endDate?: Date | null;
    description?: string | null;
    status?: TaskStatus;
  } = {};

  if (validatedData.name !== undefined) {
    updateData.name = validatedData.name;
  }
  if (validatedData.projectId !== undefined) {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
    });
    if (!project) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }
    updateData.projectId = validatedData.projectId;
  }
  if (validatedData.startDate !== undefined) {
    updateData.startDate = validatedData.startDate
      ? parseDateString(validatedData.startDate)
      : null;
  }
  if (validatedData.endDate !== undefined) {
    updateData.endDate = validatedData.endDate
      ? parseDateString(validatedData.endDate)
      : null;
  }
  if (validatedData.description !== undefined) {
    updateData.description = validatedData.description ?? null;
  }
  if (validatedData.status !== undefined) {
    updateData.status = validatedData.status as TaskStatus;
  }

  // Update task
  await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  ApiResponse.success(res, serializeData({ updated: true }));
}));

/**
 * DELETE /api/admin/tasks/:id
 * Soft delete task
 * This sets status to 'closed' as a soft delete indicator.
 * Auth: Required, Role: admin
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')

  // Validate route parameter
  const { id: taskId } = taskIdParamSchema.parse({ id: req.params.id });

  // Check if task exists
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!existingTask) {
    throw new AppError('NOT_FOUND', 'Task not found', 404);
  }

  // Soft delete: set status to 'closed'
  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'closed' as TaskStatus },
  });

  ApiResponse.success(res, serializeData({ deleted: true }));
}));

export default router;

