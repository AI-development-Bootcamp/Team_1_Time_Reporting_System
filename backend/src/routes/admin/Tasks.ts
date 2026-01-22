import { Router } from 'express';
import { TaskController } from '../../controllers/TaskController';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import { adminMiddleware } from '../../middleware/Admin';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/tasks
 * List tasks (optional filter by projectId and status)
 * Auth: Required, Role: admin
 */
router.get('/', TaskController.getTasks);

/**
 * POST /api/admin/tasks
 * Create task
 * Auth: Required, Role: admin
 */
router.post('/', TaskController.createTask);

/**
 * PUT /api/admin/tasks/:id
 * Update task
 * Auth: Required, Role: admin
 */
router.put('/:id', TaskController.updateTask);

/**
 * DELETE /api/admin/tasks/:id
 * Soft delete task
 * This sets status to 'closed' as a soft delete indicator.
 * Auth: Required, Role: admin
 */
router.delete('/:id', TaskController.deleteTask);

export default router;

