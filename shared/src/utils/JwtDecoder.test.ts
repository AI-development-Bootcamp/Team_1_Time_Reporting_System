import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { decodeJwtToken, isTokenExpired } from './JwtDecoder';

describe('JwtDecoder', () => {
    // Helper to create a JWT-like token (without actual signing)
    const createMockToken = (payload: any): string => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const body = btoa(JSON.stringify(payload));
        const signature = 'mock-signature';
        return `${header}.${body}.${signature}`;
    };

    describe('decodeJwtToken', () => {
        it('should decode a valid, non-expired token', () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const payload = {
                exp: futureExp,
                user: {
                    id: 1,
                    name: 'Test User',
                    mail: 'test@example.com',
                    userType: 'worker',
                    active: true,
                },
            };

            const token = createMockToken(payload);
            const result = decodeJwtToken(token);

            expect(result).toEqual(payload.user);
        });

        it('should return null for an expired token', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            const payload = {
                exp: pastExp,
                user: {
                    id: 1,
                    name: 'Test User',
                    mail: 'test@example.com',
                    userType: 'worker',
                    active: true,
                },
            };

            const token = createMockToken(payload);
            const result = decodeJwtToken(token);

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('JWT token has expired');
            consoleSpy.mockRestore();
        });

        it('should decode token without exp claim', () => {
            const payload = {
                user: {
                    id: 1,
                    name: 'Test User',
                    mail: 'test@example.com',
                    userType: 'worker',
                    active: true,
                },
            };

            const token = createMockToken(payload);
            const result = decodeJwtToken(token);

            expect(result).toEqual(payload.user);
        });

        it('should return null for invalid token format', () => {
            const result = decodeJwtToken('invalid.token');
            expect(result).toBeNull();
        });

        it('should return null for token without user data', () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600;
            const payload = { exp: futureExp, someOtherData: 'value' };
            const token = createMockToken(payload);

            const result = decodeJwtToken(token);
            expect(result).toBeNull();
        });
    });

    describe('isTokenExpired', () => {
        it('should return false for non-expired token', () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600;
            const payload = { exp: futureExp };
            const token = createMockToken(payload);

            expect(isTokenExpired(token)).toBe(false);
        });

        it('should return true for expired token', () => {
            const pastExp = Math.floor(Date.now() / 1000) - 3600;
            const payload = { exp: pastExp };
            const token = createMockToken(payload);

            expect(isTokenExpired(token)).toBe(true);
        });

        it('should return false for token without exp claim', () => {
            const payload = { user: { id: 1 } };
            const token = createMockToken(payload);

            expect(isTokenExpired(token)).toBe(false);
        });

        it('should return true for invalid token format', () => {
            expect(isTokenExpired('invalid.token')).toBe(true);
        });

        it('should return true for malformed token', () => {
            expect(isTokenExpired('not-a-jwt')).toBe(true);
        });
    });
});
