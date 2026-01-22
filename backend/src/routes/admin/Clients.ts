import { Router } from 'express';
import { ClientController } from '../../controllers/ClientController';
import { authMiddleware } from '../../middleware/AuthMiddleware';
import { adminMiddleware } from '../../middleware/Admin';

const router = Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/clients
 * List clients (filter active by default)
 * Auth: Required, Role: admin
 */
router.get('/', ClientController.getClients);

/**
 * POST /api/admin/clients
 * Create client
 * Auth: Required, Role: admin
 */
router.post('/', ClientController.createClient);

/**
 * PUT /api/admin/clients/:id
 * Update client
 * Auth: Required, Role: admin
 */
router.put('/:id', ClientController.updateClient);

/**
 * DELETE /api/admin/clients/:id
 * Soft delete client (set active=false)
 * Auth: Required, Role: admin
 */
router.delete('/:id', ClientController.deleteClient);

export default router;