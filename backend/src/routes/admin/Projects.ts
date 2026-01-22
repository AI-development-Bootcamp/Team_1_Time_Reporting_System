import { Router } from 'express';
import { ProjectController } from '../../controllers/ProjectController';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import { adminMiddleware } from '../../middleware/Admin';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/projects
 * List projects (optional filter by clientId and active status)
 * Auth: Required, Role: admin
 */
router.get('/', ProjectController.getProjects);

/**
 * POST /api/admin/projects
 * Create project
 * Auth: Required, Role: admin
 */
router.post('/', ProjectController.createProject);

/**
 * PUT /api/admin/projects/:id
 * Update project
 * Auth: Required, Role: admin
 */
router.put('/:id', ProjectController.updateProject);

/**
 * PATCH /api/admin/projects/:id
 * Toggle reportingType between 'startEnd' and 'duration'
 * Auth: Required, Role: admin
 */
router.patch('/:id', ProjectController.toggleReportingType);

/**
 * DELETE /api/admin/projects/:id
 * Soft delete project (set active=false)
 * Auth: Required, Role: admin
 */
router.delete('/:id', ProjectController.deleteProject);

/**
 * GET /api/admin/projects/by-task/:taskId
 * Get project by task ID
 * Auth: Required, Role: admin
 */
router.get('/by-task/:taskId', ProjectController.getProjectByTaskId);

export default router;


