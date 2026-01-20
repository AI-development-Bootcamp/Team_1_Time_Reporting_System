import { Response, NextFunction } from 'express';
import { AppError } from './ErrorHandler';
import { AuthRequest } from './AuthMiddleware';

/**
 * Admin role check middleware
 * Must be used after authMiddleware to ensure user is authenticated
 * Checks if userType === 'admin' and throws 403 FORBIDDEN if not
 */
export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userType) {
    throw new AppError('UNAUTHORIZED', 'User not authenticated', 401);
  }

  if (req.userType !== 'admin') {
    throw new AppError('FORBIDDEN', 'Admin access required', 403);
  }

  next();
};
