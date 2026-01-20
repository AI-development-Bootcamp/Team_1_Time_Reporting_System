import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/UserService';
import { ApiResponse } from '../utils/Response';
import {
    createUserSchema,
    updateUserSchema,
    resetPasswordSchema,
    getUsersQuerySchema
} from '../validators/user.schema';
import { AppError } from '../middleware/ErrorHandler';

/**
 * UserController - Handles user management HTTP requests
 */
export class UserController {
    /**
     * GET /api/admin/users?active=true
     * GET /api/admin/users?id=123
     * List users with optional active filter, or get specific user by id
     */
    static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Parse and validate query params
            const queryParams = getUsersQuerySchema.safeParse(req.query);

            if (!queryParams.success) {
                throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, queryParams.error.errors);
            }

            const { active, id } = queryParams.data;

            // If id is provided, return single user
            if (id !== undefined && id !== null) {
                const user = await UserService.getUserById(id);
                ApiResponse.success(res, user);
                return;
            }

            // Otherwise return list of users
            const users = await UserService.getUsers({ active });
            ApiResponse.success(res, users);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/admin/users
     * Create new user
     */
    static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = createUserSchema.parse(req.body);

            // Create user
            const result = await UserService.createUser(validatedData);

            // Return 201 Created with user ID
            ApiResponse.success(res, result, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/admin/users/:id
     * Update user (password NOT allowed - use reset-password endpoint)
     */
    static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate ID first
            const idSchema = z.string().regex(/^\d+$/).transform((s) => BigInt(s));
            const userId = idSchema.parse(req.params.id);

            // Validate request body (password is NOT allowed)
            const validatedData = updateUserSchema.parse(req.body);

            // Update user
            const result = await UserService.updateUser(userId, validatedData);

            ApiResponse.success(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/admin/users/:id
     * Soft delete user (set active = false)
     */
    static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate ID first
            const idSchema = z.string().regex(/^\d+$/).transform((s) => BigInt(s));
            const userId = idSchema.parse(req.params.id);

            // Delete user
            const result = await UserService.deleteUser(userId);

            ApiResponse.success(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/admin/users/:id/reset-password
     * Reset user password
     */
    static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate ID first
            const idSchema = z.string().regex(/^\d+$/).transform((s) => BigInt(s));
            const userId = idSchema.parse(req.params.id);

            // Validate request body
            const validatedData = resetPasswordSchema.parse(req.body);

            // Reset password
            const result = await UserService.resetPassword(userId, validatedData.newPassword);

            ApiResponse.success(res, result);
        } catch (error) {
            next(error);
        }
    }
}
