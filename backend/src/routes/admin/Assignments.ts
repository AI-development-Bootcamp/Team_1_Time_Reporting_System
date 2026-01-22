import { Router } from 'express';
import { AssignmentController } from '../../controllers/AssignmentController';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import { adminMiddleware } from '../../middleware/Admin';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/assignments
 * List all user-task assignments
 * Auth: Required, Role: admin
 */
router.get('/', AssignmentController.getAssignments);

/**
 * POST /api/admin/assignments
 * Create assignment (TaskWorker)
 * Auth: Required, Role: admin
 */
router.post('/', AssignmentController.createAssignment);

/**
 * GET /api/admin/assignments/:taskId/users
 * Get list of workers assigned to a specific task
 * Returns: [{ id: number, name: string }, ...]
 * Only returns active users
 * NOTE: This must come before DELETE /:id to ensure proper route matching
 */
router.get('/:taskId/users', AssignmentController.getTaskWorkers);

/**
 * DELETE /api/admin/assignments/:id
 * Delete assignment
 * id format: "taskId:userId"
 * Auth: Required, Role: admin
 */
router.delete('/:id', AssignmentController.deleteAssignment);

export default router;
