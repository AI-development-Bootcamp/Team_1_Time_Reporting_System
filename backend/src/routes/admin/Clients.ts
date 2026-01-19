import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
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
const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/admin/clients
 * List clients (filter active by default)
 * Auth: Required, Role: admin
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')
  // For now, this endpoint is accessible without auth (will be secured by Member 1)

  // Query param: active (boolean, optional)
  // Default to true if not specified (show only active clients)
  const activeFilter = req.query.active !== undefined 
    ? req.query.active === 'true' 
    : true;

  const clients = await prisma.client.findMany({
    where: {
      active: activeFilter,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  ApiResponse.success(res, serializeData(clients));
}));

/**
 * POST /api/admin/clients
 * Create client
 * Auth: Required, Role: admin
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')

  // Validate request body
  const validatedData = createClientSchema.parse(req.body);

  // Check if client with same name already exists
  const existingClient = await prisma.client.findFirst({
    where: {
      name: validatedData.name,
    },
  });

  if (existingClient) {
    throw new AppError('CONFLICT', 'Client with this name already exists', 409);
  }

  // Create client
  const client = await prisma.client.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      active: true, // New clients are active by default
    },
  });

  ApiResponse.success(res, serializeData({ id: client.id }), 201);
}));

/**
 * PUT /api/admin/clients/:id
 * Update client
 * Auth: Required, Role: admin
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')

  const clientId = BigInt(req.params.id);

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!existingClient) {
    throw new AppError('NOT_FOUND', 'Client not found', 404);
  }

  // Validate request body
  const validatedData = updateClientSchema.parse(req.body);

  // Prepare update data (only include fields that are provided)
  const updateData: {
    name?: string;
    description?: string | null;
    active?: boolean;
  } = {};

  if (validatedData.name !== undefined) {
    updateData.name = validatedData.name;
  }
  if (validatedData.description !== undefined) {
    updateData.description = validatedData.description ?? null;
  }
  if (validatedData.active !== undefined) {
    updateData.active = validatedData.active;
  }

  // Update client
  await prisma.client.update({
    where: { id: clientId },
    data: updateData,
  });

  ApiResponse.success(res, serializeData({ updated: true }));
}));

/**
 * DELETE /api/admin/clients/:id
 * Soft delete client (set active=false)
 * Auth: Required, Role: admin
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Add admin auth middleware check (userType === 'admin')

  const clientId = BigInt(req.params.id);

  // Check if client exists
  const existingClient = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!existingClient) {
    throw new AppError('NOT_FOUND', 'Client not found', 404);
  }

  // Soft delete: set active = false
  await prisma.client.update({
    where: { id: clientId },
    data: { active: false },
  });

  ApiResponse.success(res, serializeData({ deleted: true }));
}));

export default router;