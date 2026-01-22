import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController';
import { authMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// Apply auth middleware to all attendance routes
router.use(authMiddleware);

/**
 * POST /api/attendance
 * Create a new attendance record (for non-work statuses or simple work)
 */
router.post('/', AttendanceController.create);

/**
 * POST /api/attendance/combined
 * Create attendance + time logs atomically (for work status with logs)
 */
router.post('/combined', AttendanceController.createCombined);

/**
 * GET /api/attendance/month-history
 * Get attendance records for a specific month
 */
router.get('/month-history', AttendanceController.getMonthHistory);

/**
 * PUT /api/attendance/:id
 * Update an existing attendance record
 */
router.put('/:id', AttendanceController.update);

export default router;
