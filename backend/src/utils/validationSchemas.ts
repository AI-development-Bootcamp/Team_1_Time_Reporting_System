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
