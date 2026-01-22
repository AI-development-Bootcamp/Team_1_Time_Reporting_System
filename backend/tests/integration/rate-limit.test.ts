import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { Express } from 'express';

describe('Rate Limiting - Auth Endpoints', () => {
    // Store original env values
    const originalEnv = { ...process.env };
    let app: Express;

    beforeEach(() => {
        // Ensure we're not in test mode for rate limit tests
        delete process.env.NODE_ENV;
        // Set CORS origins to satisfy the CORS check when not in dev/test mode
        process.env.LOCAL_CORS_ORIGINS = 'http://localhost:3000';
        // Create app after clearing NODE_ENV so rate limiter reads correct env
        app = createApp();
    });

    afterEach(() => {
        // Restore original env
        process.env = { ...originalEnv };
    });

    it('should enforce rate limit on login endpoint', async () => {
        // Make more requests than the limit allows
        const maxRequests = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5');

        // Make requests up to the limit
        for (let i = 0; i < maxRequests; i++) {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ mail: 'test@example.com', password: 'wrong' });

            // Should get 401 (invalid credentials), not 429 (rate limit)
            expect(response.status).not.toBe(429);
        }

        // The next request should be rate limited
        const response = await request(app)
            .post('/api/auth/login')
            .send({ mail: 'test@example.com', password: 'wrong' });

        expect(response.status).toBe(429);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('TOO_MANY_REQUESTS');
        expect(response.body.error.message).toContain('Too many login attempts');

        // Should include rate limit headers
        expect(response.headers).toHaveProperty('ratelimit-limit');
        expect(response.headers).toHaveProperty('ratelimit-remaining');
    }, 30000); // Increase timeout for this test

    it('should not rate limit other endpoints', async () => {
        // Health endpoint should not be rate limited
        const healthResponses = await Promise.all(
            Array(10).fill(0).map(() => request(app).get('/health'))
        );

        healthResponses.forEach(response => {
            expect(response.status).toBe(200);
            expect(response.headers).not.toHaveProperty('ratelimit-limit');
        });
    });
});
