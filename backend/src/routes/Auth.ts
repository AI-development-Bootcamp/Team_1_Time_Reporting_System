import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { loginSchema } from '../utils/validationSchemas';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { Bcrypt } from '../utils/Bcrypt';

const router = Router();
const prisma = new PrismaClient();

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

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('INTERNAL_ERROR', 'JWT secret not configured', 500);
    }

    const token = jwt.sign(
      { userId: user.id.toString(), userType: user.userType },
      secret,
      { expiresIn: '24h' }
    );

    // Return response (exclude password, convert BigInt to number)
    ApiResponse.success(res, {
      token,
      expiresInHours: 24,
      user: {
        id: Number(user.id),
        name: user.name,
        mail: user.mail,
        userType: user.userType,
        active: user.active,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
