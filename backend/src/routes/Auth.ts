import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loginSchema } from '../utils/validationSchemas';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { Bcrypt } from '../utils/Bcrypt';
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

// ============================================================================
// Routes
// ============================================================================

const router = Router();

router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { mail: validatedData.mail },
    });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.active) {
      throw new AppError('UNAUTHORIZED', 'Account is inactive', 401);
    }

    // Compare password
    const isPasswordValid = await Bcrypt.compare(validatedData.password, user.password);
    
    if (!isPasswordValid) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    // Generate JWT token with full user data in payload
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('INTERNAL_ERROR', 'JWT secret not configured', 500);
    }

    // Prepare user data for token (convert BigInt to number, dates to ISO strings)
    const userData = {
      id: Number(user.id),
      name: user.name,
      mail: user.mail,
      userType: user.userType,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const token = jwt.sign(
      {
        userId: user.id.toString(),
        userType: user.userType,
        user: userData, // Store full user data in token
      },
      secret,
      { expiresIn: '24h' }
    );

    // Return only token (user data is stored in token and can be decoded on frontend)
    ApiResponse.success(res, {
      token,
      expiresInHours: 24,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user data from JWT token (returns user data from decoded token)
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated', 401);
    }

    // Return user data from token (no database query needed)
    ApiResponse.success(res, req.user);
  } catch (error) {
    next(error);
  }
});

export default router;
