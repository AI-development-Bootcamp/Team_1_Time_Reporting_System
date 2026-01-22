import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './ErrorHandler';
import { prisma } from '../utils/prismaClient';

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
export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

        if (!decoded.userId || !decoded.userType) {
            throw new AppError('UNAUTHORIZED', 'Invalid token payload', 401);
        }

        if (decoded.userType !== 'admin' && decoded.userType !== 'worker') {
            throw new AppError('UNAUTHORIZED', 'Invalid user type', 401);
        }

        const userId = BigInt(decoded.userId);
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.active === false) {
            throw new AppError('UNAUTHORIZED', 'Account is inactive', 401);
        }

        // Use role from database instead of decoded token to prevent stale roles
        const dbUserType = user.userType as 'admin' | 'worker';
        
        // Optionally enforce role mismatch if DB role doesn't match token role
        if (decoded.userType !== dbUserType) {
            throw new AppError('UNAUTHORIZED', 'Role mismatch', 401);
        }

        req.userId = user.id; // Set from DB user (BigInt)
        req.userType = dbUserType; // Use DB role instead of decoded.userType
        // Map Prisma User to the request user structure
        req.user = {
            id: Number(user.id),
            name: user.name,
            mail: user.mail,
            userType: dbUserType,
            active: user.active,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error); // Pass to error handler
            return;
        }
        next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
    }
};
