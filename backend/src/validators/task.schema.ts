import { z } from 'zod';
import { bigIntIdSchema, optionalBigIntIdSchema, optionalDateStringSchema } from '../utils/routeUtils';

export const createTaskSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  projectId: bigIntIdSchema,
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  description: z.string().optional(),
  status: z.enum(['open', 'closed']).default('open'),
});

export const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  projectId: optionalBigIntIdSchema,
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  description: z.string().nullable().optional(),
  status: z.enum(['open', 'closed']).optional(),
});

export const taskIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(val => BigInt(val)),
});

export const projectIdQuerySchema = z.object({
  projectId: z.string().regex(/^\d+$/, 'Project ID must be a valid number').transform(val => BigInt(val)).optional(),
});

