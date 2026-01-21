import { z } from 'zod';
import { bigIntIdSchema, optionalBigIntIdSchema, dateStringSchema, optionalDateStringSchema } from '../utils/routeUtils';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: bigIntIdSchema,
  projectManagerId: bigIntIdSchema,
  startDate: dateStringSchema,
  endDate: optionalDateStringSchema,
  description: z.string().optional(),
  reportingType: z.enum(['duration', 'startEnd']).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  clientId: optionalBigIntIdSchema,
  projectManagerId: optionalBigIntIdSchema,
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  description: z.string().nullable().optional(),
  reportingType: z.enum(['duration', 'startEnd']).optional(),
  active: z.boolean().optional(),
});

export const projectIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(val => BigInt(val)),
});

export const clientIdQuerySchema = z.object({
  clientId: z.string().regex(/^\d+$/, 'Client ID must be a valid number').transform(val => BigInt(val)).optional(),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().regex(/^\d+$/, 'Task ID must be a valid number').transform(val => BigInt(val)),
});

