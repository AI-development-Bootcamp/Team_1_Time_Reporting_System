import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { ApiResponse } from '../../utils/Response';
import { AppError } from '../../middleware/ErrorHandler';

const router = Router();
const prisma = new PrismaClient();

// Wrapper pour capturer les erreurs async
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Local serialization helper to handle BigInt and Date objects
function serializeData<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeData(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeData(value);
    }
    return result;
  }

  return obj;
}

// Zod schemas for validation
const createTaskSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  projectId: z.number().int().positive('Project ID must be a positive integer'),
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
  projectId: z.number().int().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  description: z.string().nullable().optional(),
  status: z.enum(['open', 'closed']).optional(),
});

/**
 * GET /api/admin/tasks
 * List tasks (optional filter by projectId)
 * Auth: Required, Role: admin
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')
  // For now, this endpoint is accessible without auth (will be secured by Member 1)

  // Query param: projectId (optional filter)
  const projectIdFilter =
    typeof req.query.projectId === 'string'
      ? BigInt(req.query.projectId)
      : undefined;

  // Hide inactive (closed) tasks by default (soft delete behavior)
  // Note: we use status='open' as default filter
  const tasks = await prisma.task.findMany({
    where: {
      ...(projectIdFilter && { projectId: projectIdFilter }),
      status: 'open', // Hide closed tasks by default (soft delete)
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
    where: { id: BigInt(validatedData.projectId) },
  });

  if (!project) {
    throw new AppError('NOT_FOUND', 'Project not found', 404);
  }

  // Create task
  const task = await prisma.task.create({
    data: {
      name: validatedData.name,
      projectId: BigInt(validatedData.projectId),
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
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

  const taskId = BigInt(req.params.id);

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
      where: { id: BigInt(validatedData.projectId) },
    });
    if (!project) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }
    updateData.projectId = BigInt(validatedData.projectId);
  }
  if (validatedData.startDate !== undefined) {
    updateData.startDate = validatedData.startDate
      ? new Date(validatedData.startDate)
      : null;
  }
  if (validatedData.endDate !== undefined) {
    updateData.endDate = validatedData.endDate
      ? new Date(validatedData.endDate)
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

  const taskId = BigInt(req.params.id);

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

