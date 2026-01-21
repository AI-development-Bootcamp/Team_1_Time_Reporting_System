import { z } from 'zod';

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
    mail: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
