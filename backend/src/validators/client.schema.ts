import { z } from 'zod';
import { bigIntIdSchema } from '../utils/routeUtils';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export const clientIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(val => BigInt(val)),
});

