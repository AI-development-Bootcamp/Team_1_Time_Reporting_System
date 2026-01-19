import { z } from 'zod';

// Login schema - password only validates presence
export const loginSchema = z.object({
  mail: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required').refine(
    (val) => val.trim().length > 0,
    'Password cannot be only whitespace'
  ),
});

// Create user schema - password enforces strength policy
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').refine(
    (val) => val.trim().length > 0,
    'Name cannot be only whitespace'
  ),
  mail: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  userType: z.enum(['admin', 'worker']),
});

// Update user schema - all fields optional, password NOT allowed
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').refine(
    (val) => val.trim().length > 0,
    'Name cannot be only whitespace'
  ).optional(),
  mail: z.string().email('Invalid email format').optional(),
  userType: z.enum(['admin', 'worker']).optional(),
  active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

// Reset password schema - same validation as createUserSchema password
export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

// Query param schema for GET /api/admin/users
export const getUsersQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional().transform((val) => {
    if (val === undefined) return undefined;
    return val === 'true';
  }),
  id: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      try {
        return BigInt(val);
      } catch {
        return undefined;
      }
    }),
}).passthrough(); // Allow other query params to pass through without validation
