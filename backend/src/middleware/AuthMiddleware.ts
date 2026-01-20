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

        req.userId = userId;
        req.userType = decoded.userType;
        // Map Prisma User to the request user structure if needed, or update AuthRequest type
        // For now, keeping consistent with interface but using data from DB would be better
        // However, interface expects a specific structure.
        // Let's attach the minimal info or what was in token but verified.
        // Actually, request said "load the user by id... if user is missing or active === false throw".
        // It didn't explicitly say to REPLACE req.user with DB user, but it implies verification.
        // I will assign the DB user to req.user? The interface might need adjustment if DB user has Dates etc.
        // The interface defines strings for dates. Prisma DB user has Date objects.
        // I'll stick to assigning what matches the interface or updating the interface.
        // Review request: "convert decoded.userId to BigInt... query Prisma... set req.userId/req.userType/req.user"
        // I'll populate req.user with the DB data, formatted to match the interface or update interface.
        // Actually, existing interface uses strings.
        req.user = {
            id: Number(user.id),
            name: user.name,
            mail: user.mail,
            userType: user.userType as 'admin' | 'worker',
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
