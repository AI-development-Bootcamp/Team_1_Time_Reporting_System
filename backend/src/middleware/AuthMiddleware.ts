import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './ErrorHandler';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface UserPayload {
    userId: string;
    userType: 'admin' | 'worker';
    user: {
        id: number;
        name: string;
        mail: string;
        userType: 'admin' | 'worker';
        active: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

export interface AuthRequest extends Request {
    userId?: bigint;
    userType?: 'admin' | 'worker';
    user?: {
        id: number;
        name: string;
        mail: string;
        userType: 'admin' | 'worker';
        active: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Authentication middleware to verify JWT tokens and attach user info to request
 */
export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('UNAUTHORIZED', 'Missing or invalid authorization header', 401);
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new AppError('INTERNAL_ERROR', 'JWT secret not configured', 500);
        }

        const decoded = jwt.verify(token, secret) as UserPayload;

        if (!decoded.userId || !decoded.userType || !decoded.user) {
            throw new AppError('UNAUTHORIZED', 'Invalid token payload', 401);
        }

        if (decoded.userType !== 'admin' && decoded.userType !== 'worker') {
            throw new AppError('UNAUTHORIZED', 'Invalid user type', 401);
        }

        // Check if user is still active (from token data)
        if (!decoded.user.active) {
            throw new AppError('UNAUTHORIZED', 'Account is inactive', 401);
        }

        req.userId = BigInt(decoded.userId);
        req.userType = decoded.userType;
        req.user = decoded.user; // Attach full user object from token

        next();
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
    }
};
