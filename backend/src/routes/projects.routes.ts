import { Router } from 'express';
import { ProjectSelectorController } from '../controllers/ProjectSelectorController';
// import { authMiddleware } from '../middleware/AuthMiddleware'; // Uncomment when auth ready

const router = Router();

// TODO: Apply auth middleware when Member 1 completes auth
// router.use(authMiddleware);

/**
 * GET /api/projects/selector
 * Get grouped projects for user sorted by usage frequency
 * 
 * Response shape:
 * {
 *   "success": true,
 *   "data": {
 *     "clients": [
 *       {
 *         "id": "1",
 *         "name": "Client Name",
 *         "reportCount": 15,
 *         "projects": [
 *           {
 *             "id": "1",
 *             "name": "Project Name",
 *             "reportingType": "duration" | "startEnd",
 *             "reportCount": 10,
 *             "tasks": [
 *               {
 *                 "id": "1",
 *                 "name": "Task Name",
 *                 "reportCount": 5
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */
router.get('/selector', ProjectSelectorController.getSelector);

export default router;
