import { Router } from 'express';
import { AssignmentController } from '../../controllers/AssignmentController';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import { adminMiddleware } from '../../middleware/Admin';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/assignments/:taskId/users
 * Get list of workers assigned to a specific task
 * Returns: [{ id: number, name: string }, ...]
 * Only returns active users
 */
router.get('/assignments/:taskId/users', AssignmentController.getTaskWorkers);

export default router;
