import { Router } from 'express';
import { TimeLogsController } from '../controllers/TimeLogsController';
import { authMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// Apply auth middleware to all time-logs routes
router.use(authMiddleware);

/**
 * POST /api/time-logs
 * Create a new time log entry
 */
router.post('/', TimeLogsController.create);

/**
 * GET /api/time-logs?dailyAttendanceId=X
 * List time logs for a specific attendance record
 */
router.get('/', TimeLogsController.getByAttendance);

/**
 * PUT /api/time-logs/:id
 * Update an existing time log
 */
router.put('/:id', TimeLogsController.update);

/**
 * DELETE /api/time-logs/:id
 * Delete a time log
 */
router.delete('/:id', TimeLogsController.delete);

export default router;
