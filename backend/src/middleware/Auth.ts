import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './ErrorHandler';

export interface AuthRequest extends Request {
  userId?: bigint;
  userType?: 'admin' | 'worker';
}

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

    const decoded = jwt.verify(token, secret) as { userId: string; userType: 'admin' | 'worker' };
    
    req.userId = BigInt(decoded.userId);
    req.userType = decoded.userType;
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
  }
};
