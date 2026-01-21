import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController';
import { documentUpload } from '../utils/FileUpload';
// import { authMiddleware } from '../middleware/AuthMiddleware'; // Uncomment when auth ready

const router = Router();

// TODO: Apply auth middleware when Member 1 completes auth
// router.use(authMiddleware);

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

/**
 * POST /api/attendance/:id/document
 * Upload document to attendance record (for sickness/reserves)
 * Uses multer middleware to handle multipart/form-data
 */
router.post('/:id/document', documentUpload.single('document'), AttendanceController.uploadDocument);

/**
 * DELETE /api/attendance/:id/document
 * Delete document from attendance record
 */
router.delete('/:id/document', AttendanceController.deleteDocument);

export default router;
