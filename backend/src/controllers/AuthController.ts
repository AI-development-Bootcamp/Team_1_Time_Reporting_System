import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { loginSchema } from '../validators/auth.schema';
import { AuthRequest } from '../middleware/AuthMiddleware';

/**
 * AuthController - Handles authentication HTTP requests
 */
export class AuthController {
    /**
     * POST /api/auth/login
     * Authenticate user and return JWT token
     */
    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = loginSchema.parse(req.body);

            // Call service to perform login
            const result = await AuthService.login(validatedData);

            // Return token
            ApiResponse.success(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/me
     * Get current user data from JWT token
     */
    static async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new AppError('UNAUTHORIZED', 'User not authenticated', 401);
            }

            // Return user data from token (no database query needed)
            ApiResponse.success(res, req.user);
        } catch (error) {
            next(error);
        }
    }
}
