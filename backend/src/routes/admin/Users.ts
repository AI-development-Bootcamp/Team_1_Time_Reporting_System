import { Router } from 'express';
import { UserController } from '../../controllers/UserController';
import { authMiddleware } from '../../middleware/AuthMiddleware';
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
router.get('/users', UserController.getUsers);

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', UserController.createUser);

/**
 * PUT /api/admin/users/:id
 * Update user (password NOT allowed - use reset-password endpoint)
 */
router.put('/users/:id', UserController.updateUser);

/**
 * DELETE /api/admin/users/:id
 * Soft delete user (set active = false)
 */
router.delete('/users/:id', UserController.deleteUser);

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password
 */
router.post('/users/:id/reset-password', UserController.resetPassword);

export default router;
