import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prismaClient';
import { createUserSchema, updateUserSchema, resetPasswordSchema, getUsersQuerySchema } from '../../utils/validationSchemas';
import { ApiResponse } from '../../utils/Response';
import { AppError } from '../../middleware/ErrorHandler';
import { Bcrypt } from '../../utils/Bcrypt';
import { authMiddleware, AuthRequest } from '../Auth';
import { adminMiddleware } from '../../middleware/Admin';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/users?active=true
 * GET /api/admin/users?id=123
 * List users with optional active filter, or get specific user by id
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Parse and validate query params
    const queryParams = getUsersQuerySchema.safeParse(req.query);
    
    if (!queryParams.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', 400, queryParams.error.errors);
    }

    const { active, id } = queryParams.data;

    // If id is provided, return single user
    if (id !== undefined && id !== null) {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          mail: true,
          userType: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('NOT_FOUND', 'User not found', 404);
      }

      // Convert BigInt ID to number
      const formattedUser = {
        ...user,
        id: Number(user.id),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };

      ApiResponse.success(res, formattedUser);
      return;
    }

    // Build where clause for list query
    // Default to active: true when no filter is provided
    const where: any = {
      active: active !== undefined && active !== null ? active : true,
    };

    // Fetch users (exclude passwords)
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        mail: true,
        userType: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert BigInt IDs to numbers
    const formattedUsers = users.map((user) => ({
      ...user,
      id: Number(user.id),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    ApiResponse.success(res, formattedUsers);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createUserSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { mail: validatedData.mail },
    });

    if (existingUser) {
      throw new AppError(
        'USER_ALREADY_EXISTS',
        'A user with this email address already exists.',
        409,
        {
          target: 'email',
          details: [
            {
              field: 'email',
              issue: 'ALREADY_EXISTS',
              description: `The email '${validatedData.mail}' is already registered.`,
            },
          ],
        }
      );
    }

    // Hash password
    const hashedPassword = await Bcrypt.hash(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        mail: validatedData.mail,
        password: hashedPassword,
        userType: validatedData.userType,
        active: true,
      },
      select: {
        id: true,
      },
    });

    // Return 201 Created with user ID
    ApiResponse.success(res, { id: Number(user.id) }, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user (password NOT allowed - use reset-password endpoint)
 */
router.put('/users/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = BigInt(req.params.id);

    // Validate request body (password is NOT allowed)
    const validatedData = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // Check for duplicate email if mail is being updated
    if (validatedData.mail && validatedData.mail !== existingUser.mail) {
      const emailExists = await prisma.user.findUnique({
        where: { mail: validatedData.mail },
      });

      if (emailExists) {
        throw new AppError('CONFLICT', 'Email already exists', 409, {
          mail: 'Email already exists',
        });
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: validatedData,
    });

    ApiResponse.success(res, { updated: true });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/users/:id
 * Soft delete user (set active = false)
 */
router.delete('/users/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = BigInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // Soft delete (set active = false)
    await prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });

    ApiResponse.success(res, { deleted: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password
 */
router.post('/users/:id/reset-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = BigInt(req.params.id);

    // Validate request body
    const validatedData = resetPasswordSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    // Hash new password
    const hashedPassword = await Bcrypt.hash(validatedData.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    ApiResponse.success(res, { updated: true });
  } catch (error) {
    next(error);
  }
});

export default router;
