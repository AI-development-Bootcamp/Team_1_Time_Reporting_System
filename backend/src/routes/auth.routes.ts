import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/AuthMiddleware';
import { authRateLimiter } from '../middleware/RateLimiter';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Rate limited to prevent brute force attacks
 */
router.post('/login', authRateLimiter, AuthController.login);

/**
 * GET /api/auth/me
 * Get current user data from JWT token (requires authentication)
 */
router.get('/me', authMiddleware, AuthController.me);

export default router;
