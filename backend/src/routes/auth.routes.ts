import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', AuthController.login);

/**
 * GET /api/auth/me
 * Get current user data from JWT token (requires authentication)
 */
router.get('/me', authMiddleware, AuthController.me);

export default router;
