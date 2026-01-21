import { z } from 'zod';

/**
 * Password validation regex:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 special character
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordErrorMessage = 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one special character (@$!%*?&)';

/**
 * Create user validation schema
 */
export const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    mail: z.string().email('Invalid email format'),
    password: z.string().regex(passwordRegex, passwordErrorMessage),
    userType: z.enum(['admin', 'worker'], {
        errorMap: () => ({ message: 'User type must be either admin or worker' }),
    }),
});

/**
 * Update user validation schema (password not allowed - use reset-password endpoint)
 */
export const updateUserSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    mail: z.string().email('Invalid email format').optional(),
    userType: z.enum(['admin', 'worker'], {
        errorMap: () => ({ message: 'User type must be either admin or worker' }),
    }).optional(),
    active: z.boolean().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
);

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z.object({
    newPassword: z.string().regex(passwordRegex, passwordErrorMessage),
});

/**
 * Get users query parameters validation schema
 */
/**
 * Valid user types for filtering
 */
const validUserTypes = ['admin', 'worker'] as const;
export type UserTypeFilter = typeof validUserTypes[number];

export const getUsersQuerySchema = z.object({
    active: z
        .string()
        .optional()
        .refine((val) => val === undefined || val === 'true' || val === 'false', {
            message: "Active must be 'true' or 'false'",
        })
        .transform((val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return undefined;
        }),
    id: z
        .string()
        .optional()
        .refine((val) => val === undefined || /^\d+$/.test(val), {
            message: 'ID must be a numeric string',
        })
        .transform((val) => (val ? BigInt(val) : undefined)),
    userType: z
        .string()
        .optional()
        .refine(
            (val) => val === undefined || validUserTypes.includes(val as UserTypeFilter),
            {
                message: `userType must be one of: ${validUserTypes.join(', ')}`,
            }
        ) as z.ZodType<UserTypeFilter | undefined>,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
