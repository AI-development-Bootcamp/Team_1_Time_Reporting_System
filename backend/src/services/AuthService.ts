import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prismaClient';
import { Bcrypt } from '../utils/Bcrypt';
import { AppError } from '../middleware/ErrorHandler';
import { LoginInput } from '../validators/auth.schema';

/**
 * AuthService - Handles authentication business logic
 */
export class AuthService {
    /**
     * Authenticate user with email and password
     * @returns JWT token and expiration info
     */
    static async login(credentials: LoginInput) {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { mail: credentials.mail },
        });

        if (!user) {
            throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
        }

        // Check if user is active
        if (!user.active) {
            throw new AppError('UNAUTHORIZED', 'Account is inactive', 401);
        }

        // Compare password
        const isPasswordValid = await Bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
            throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
        }

        // Generate JWT token
        const token = this.generateToken(user);

        return {
            token,
            expiresInHours: 24,
        };
    }

    /**
     * Generate JWT token with user payload
     */
    static generateToken(user: any): string {
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

        return token;
    }
}
