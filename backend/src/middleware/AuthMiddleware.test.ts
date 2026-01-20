import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/AuthMiddleware';
import { AppError } from '../middleware/ErrorHandler';

describe('authMiddleware', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    const originalSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        mockReq = {
            headers: {},
        };
        mockRes = {};
        mockNext = vi.fn();
        process.env.JWT_SECRET = 'test-secret-key';
    });

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret;
        vi.clearAllMocks();
    });

    describe('valid cases', () => {
        it('should allow valid JWT token with admin userType', () => {
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

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).not.toThrow();

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.userId).toBeDefined();
            expect(mockReq.userType).toBe('admin');
        });

        it('should allow valid JWT token with worker userType', () => {
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

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).not.toThrow();

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.userId).toBeDefined();
            expect(mockReq.userType).toBe('worker');
        });

        it('should attach userId as BigInt to request', () => {
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

            authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(typeof mockReq.userId === 'bigint').toBe(true);
            expect(mockReq.userId?.toString()).toBe('123');
        });
    });

    describe('invalid cases', () => {
        it('should throw UNAUTHORIZED when authorization header is missing', () => {
            mockReq.headers = {};

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow(AppError);

            try {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(AppError);
                expect((error as AppError).code).toBe('UNAUTHORIZED');
                expect((error as AppError).statusCode).toBe(401);
            }
        });

        it('should throw UNAUTHORIZED when authorization header does not start with Bearer', () => {
            mockReq.headers = { authorization: 'InvalidToken' };

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow(AppError);

            try {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(AppError);
                expect((error as AppError).code).toBe('UNAUTHORIZED');
            }
        });

        it('should throw UNAUTHORIZED when authorization header has wrong format', () => {
            mockReq.headers = { authorization: 'TokenWithoutBearer' };

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow(AppError);
        });

        it('should throw INTERNAL_ERROR when JWT_SECRET is not configured', () => {
            delete process.env.JWT_SECRET;
            const token = jwt.sign({ userId: '1', userType: 'admin' }, 'test-secret-key');
            mockReq.headers = { authorization: `Bearer ${token}` };

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow(AppError);

            try {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(AppError);
                expect((error as AppError).code).toBe('INTERNAL_ERROR');
                expect((error as AppError).statusCode).toBe(500);
            }
        });

        it('should throw UNAUTHORIZED when token is invalid', () => {
            mockReq.headers = { authorization: 'Bearer invalid-token-string' };

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow(AppError);

            try {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(AppError);
                expect((error as AppError).code).toBe('UNAUTHORIZED');
            }
        });

        it('should throw UNAUTHORIZED when token is signed with wrong secret', () => {
            const token = jwt.sign({ userId: '1', userType: 'admin' }, 'wrong-secret');
            mockReq.headers = { authorization: `Bearer ${token}` };

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow(AppError);
        });

        it('should throw UNAUTHORIZED when token is expired', () => {
            const token = jwt.sign({ userId: '1', userType: 'admin' }, 'test-secret-key', { expiresIn: '-1h' });
            mockReq.headers = { authorization: `Bearer ${token}` };

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow(AppError);
        });

        it('should throw UNAUTHORIZED when token payload is missing userId', () => {
            const token = jwt.sign({ userType: 'admin' }, 'test-secret-key');
            mockReq.headers = { authorization: `Bearer ${token}` };

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow();
        });

        it('should throw UNAUTHORIZED when token payload is missing userType', () => {
            const token = jwt.sign({ userId: '1' }, 'test-secret-key');
            mockReq.headers = { authorization: `Bearer ${token}` };

            expect(() => {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            }).toThrow(AppError);

            try {
                authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(AppError);
                expect((error as AppError).code).toBe('UNAUTHORIZED');
            }
        });
    });
});
