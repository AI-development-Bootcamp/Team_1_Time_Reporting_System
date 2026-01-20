import { Router } from 'express';
import { ProjectController } from '../../controllers/ProjectController';

const router = Router();

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

export default router;


