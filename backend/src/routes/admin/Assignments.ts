import { Router } from 'express';
import { AssignmentController } from '../../controllers/AssignmentController';

const router = Router();

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
 * DELETE /api/admin/assignments/:id
 * Delete assignment
 * id format: "taskId:userId"
 * Auth: Required, Role: admin
 */
router.delete('/:id', AssignmentController.deleteAssignment);

export default router;


