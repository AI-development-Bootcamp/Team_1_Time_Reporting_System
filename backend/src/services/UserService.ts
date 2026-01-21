import { prisma } from '../utils/prismaClient';
import { Prisma } from '@prisma/client';
import { Bcrypt } from '../utils/Bcrypt';
import { AppError } from '../middleware/ErrorHandler';
import { CreateUserInput, UpdateUserInput } from '../validators/user.schema';

/**
 * UserService - Handles user business logic and database operations
 */
export class UserService {
    /**
     * Get users with optional filters
     */
    static async getUsers(filters: { active?: boolean; userType?: string }) {
        const where: Prisma.UserWhereInput = {
            active: filters.active !== undefined ? filters.active : true,
        };

        if (filters.userType) {
            where.userType = filters.userType as Prisma.EnumUserTypeFilter | undefined;
        }

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

        // Convert BigInt IDs to numbers and dates to ISO strings
        return users.map((user) => ({
            ...user,
            id: Number(user.id),
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        }));
    }

    /**
     * Get single user by ID
     */
    static async getUserById(id: bigint) {
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

        // Convert BigInt ID to number and dates to ISO strings
        return {
            ...user,
            id: Number(user.id),
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }

    /**
     * Create new user with password hashing
     */
    static async createUser(data: CreateUserInput) {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { mail: data.mail },
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
                            description: `The email '${data.mail}' is already registered.`,
                        },
                    ],
                }
            );
        }

        // Hash password
        const hashedPassword = await Bcrypt.hash(data.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: data.name,
                mail: data.mail,
                password: hashedPassword,
                userType: data.userType,
                active: true,
            },
            select: {
                id: true,
            },
        });

        return { id: Number(user.id) };
    }

    /**
     * Update user (password NOT allowed - use resetPassword)
     */
    static async updateUser(id: bigint, data: UpdateUserInput) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new AppError('NOT_FOUND', 'User not found', 404);
        }

        // Check for duplicate email if mail is being updated
        if (data.mail && data.mail !== existingUser.mail) {
            const emailExists = await prisma.user.findUnique({
                where: { mail: data.mail },
            });

            if (emailExists) {
                throw new AppError('CONFLICT', 'Email already exists', 409, {
                    mail: 'Email already exists',
                });
            }
        }

        // Update user
        await prisma.user.update({
            where: { id },
            data,
        });

        return { updated: true };
    }

    /**
     * Soft delete user (set active = false)
     */
    static async deleteUser(id: bigint) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new AppError('NOT_FOUND', 'User not found', 404);
        }

        // Soft delete (set active = false)
        await prisma.user.update({
            where: { id },
            data: { active: false },
        });

        return { deleted: true };
    }

    /**
     * Reset user password
     */
    static async resetPassword(id: bigint, newPassword: string) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new AppError('NOT_FOUND', 'User not found', 404);
        }

        // Hash new password
        const hashedPassword = await Bcrypt.hash(newPassword);

        // Update password
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        return { updated: true };
    }
}
