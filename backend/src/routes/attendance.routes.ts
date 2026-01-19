import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController';
// import { authMiddleware } from '../middleware/AuthMiddleware'; // Uncomment when auth ready

const router = Router();

// TODO: Apply auth middleware when Member 1 completes auth
// router.use(authMiddleware);

/**
 * POST /api/attendance
 * Create a new attendance record
 */
router.post('/', AttendanceController.create);

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
