import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/AuthMiddleware';
import { AppError } from '../middleware/ErrorHandler';
import { prisma } from '../utils/prismaClient';

// Mock prisma client
vi.mock('../utils/prismaClient', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

describe('authMiddleware', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: ReturnType<typeof vi.fn>;
    const originalSecret = process.env.JWT_SECRET;
    const mockedPrisma = vi.mocked(prisma);

    beforeEach(() => {
        mockReq = {
            headers: {},
        };
        mockRes = {};
        mockNext = vi.fn();
        process.env.JWT_SECRET = 'test-secret-key';
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret;
        vi.clearAllMocks();
    });

    describe('valid cases', () => {
        it('should allow valid JWT token with admin userType', async () => {
            const userData = {
                id: 1,
                name: 'Test Admin',
                mail: 'admin@test.com',
                userType: 'admin' as const,
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const token = jwt.sign(
                { userId: '1', userType: 'admin', user: userData },
                'test-secret-key'
            );
            mockReq.headers = { authorization: `Bearer ${token}` };

            // Mock DB response
            (mockedPrisma.user.findUnique as any).mockResolvedValue({
                ...userData,
                id: BigInt(1),
                createdAt: new Date(),
                updatedAt: new Date(),
                password: 'hashed_password' // Missing in original object but required by type
            });

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.userId).toBeDefined();
            expect(mockReq.userType).toBe('admin');
            expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: BigInt(1) } });
        });

        it('should allow valid JWT token with worker userType', async () => {
            const userData = {
                id: 2,
                name: 'Test Worker',
                mail: 'worker@test.com',
                userType: 'worker' as const,
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const token = jwt.sign(
                { userId: '2', userType: 'worker', user: userData },
                'test-secret-key'
            );
            mockReq.headers = { authorization: `Bearer ${token}` };

            (mockedPrisma.user.findUnique as any).mockResolvedValue({
                ...userData,
                id: BigInt(2),
                createdAt: new Date(),
                updatedAt: new Date(),
                password: 'hashed_password'
            });

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.userId).toBeDefined();
            expect(mockReq.userType).toBe('worker');
        });

        it('should attach userId as BigInt to request', async () => {
            const userData = {
                id: 123,
                name: 'Test User',
                mail: 'test@test.com',
                userType: 'worker' as const,
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const token = jwt.sign(
                { userId: '123', userType: 'worker', user: userData },
                'test-secret-key'
            );
            mockReq.headers = { authorization: `Bearer ${token}` };

            (mockedPrisma.user.findUnique as any).mockResolvedValue({
                ...userData,
                id: BigInt(123),
                createdAt: new Date(),
                updatedAt: new Date(),
                password: 'hashed_password'
            });

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(typeof mockReq.userId === 'bigint').toBe(true);
            expect(mockReq.userId?.toString()).toBe('123');
        });
    });

    describe('invalid cases', () => {
        it('should call next with UNAUTHORIZED error when authorization header is missing', async () => {
            mockReq.headers = {};

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            const error = mockNext.mock.calls[0][0] as AppError;
            expect(error.code).toBe('UNAUTHORIZED');
            expect(error.statusCode).toBe(401);
        });

        it('should call next with UNAUTHORIZED error when authorization header does not start with Bearer', async () => {
            mockReq.headers = { authorization: 'InvalidToken' };

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            const error = mockNext.mock.calls[0][0] as AppError;
            expect(error.code).toBe('UNAUTHORIZED');
        });

        it('should call next with UNAUTHORIZED error when authorization header has wrong format', async () => {
            mockReq.headers = { authorization: 'TokenWithoutBearer' };

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should call next with INTERNAL_ERROR when JWT_SECRET is not configured', async () => {
            delete process.env.JWT_SECRET;
            const token = jwt.sign({ userId: '1', userType: 'admin' }, 'test-secret-key');
            mockReq.headers = { authorization: `Bearer ${token}` };

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            const error = mockNext.mock.calls[0][0] as AppError;
            expect(error.code).toBe('INTERNAL_ERROR');
            expect(error.statusCode).toBe(500);
        });

        it('should call next with UNAUTHORIZED error when token is invalid', async () => {
            mockReq.headers = { authorization: 'Bearer invalid-token-string' };

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            const error = mockNext.mock.calls[0][0] as AppError;
            expect(error.code).toBe('UNAUTHORIZED');
        });

        it('should call next with UNAUTHORIZED error when token is signed with wrong secret', async () => {
            const token = jwt.sign({ userId: '1', userType: 'admin' }, 'wrong-secret');
            mockReq.headers = { authorization: `Bearer ${token}` };

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should call next with UNAUTHORIZED error when token is expired', async () => {
            const token = jwt.sign({ userId: '1', userType: 'admin' }, 'test-secret-key', { expiresIn: '-1h' });
            mockReq.headers = { authorization: `Bearer ${token}` };

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should call next with error when token payload is missing userId', async () => {
            const token = jwt.sign({ userType: 'admin' }, 'test-secret-key');
            mockReq.headers = { authorization: `Bearer ${token}` };

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.anything());
        });

        it('should call next with UNAUTHORIZED error when token payload is missing userType', async () => {
            const token = jwt.sign({ userId: '1' }, 'test-secret-key');
            mockReq.headers = { authorization: `Bearer ${token}` };

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            const error = mockNext.mock.calls[0][0] as AppError;
            expect(error.code).toBe('UNAUTHORIZED');
        });

        it('should call next with UNAUTHORIZED error when user is not found in database', async () => {
            const userData = {
                id: 999,
                userType: 'worker' as const,
            };
            const token = jwt.sign(
                { userId: '999', userType: 'worker', user: userData },
                'test-secret-key'
            );
            mockReq.headers = { authorization: `Bearer ${token}` };

            // Mock DB returning null
            (mockedPrisma.user.findUnique as any).mockResolvedValue(null);

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            const error = mockNext.mock.calls[0][0] as AppError;
            expect(error.code).toBe('UNAUTHORIZED');
        });

        it('should call next with UNAUTHORIZED error when user is inactive', async () => {
            const userData = {
                id: 3,
                active: false,
            };
            const token = jwt.sign(
                { userId: '3', userType: 'worker', user: userData },
                'test-secret-key'
            );
            mockReq.headers = { authorization: `Bearer ${token}` };

            // Mock DB returning inactive user
            (mockedPrisma.user.findUnique as any).mockResolvedValue({
                id: BigInt(3),
                active: false,
                name: 'Inactive',
                mail: 'inactive@test.com',
                password: 'hash',
                userType: 'worker',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext as NextFunction);

            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
            const error = mockNext.mock.calls[0][0] as AppError;
            expect(error.code).toBe('UNAUTHORIZED');
        });
    });
});
