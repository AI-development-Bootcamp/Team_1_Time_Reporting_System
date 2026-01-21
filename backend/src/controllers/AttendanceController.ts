import { Request, Response, NextFunction } from 'express';
import { DailyAttendanceStatus, LocationStatus } from '@prisma/client';
import { AttendanceService } from '../services/AttendanceService';
import { CombinedAttendanceService } from '../services/CombinedAttendanceService';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { logAudit } from '../utils/AuditLog';
import { parseBigIntParam } from '../utils/paramValidation';
import { validateUploadedFile } from '../utils/FileUpload';
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  monthHistoryQuerySchema,
  combinedAttendanceSchema,
} from '../validators/attendance.schema';

export class AttendanceController {
  /**
   * POST /api/attendance
   * Create a new DailyAttendance record
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createAttendanceSchema.parse(req.body);

      if (body.status === 'work') {
        throw new AppError(
          'VALIDATION_ERROR',
          'Work attendance must be submitted via /api/attendance/combined',
          400
        );
      }

      // TODO: Get userId from authenticated user (req.user.id) when auth is ready
      const userId = body.userId;

      const id = await AttendanceService.createAttendance({
        userId,
        date: body.date,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        status: body.status as DailyAttendanceStatus,
      });

      // Audit log after successful create
      logAudit({
        action: 'CREATE_ATTENDANCE',
        userId,
        entity: 'DailyAttendance',
        entityId: id,
        payload: { date: body.date, startTime: body.startTime, endTime: body.endTime, status: body.status },
        req,
      });

      ApiResponse.success(res, { id: id.toString() }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attendance/month-history
   * Get attendance records for a specific month
   */
  static async getMonthHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const query = monthHistoryQuerySchema.parse(req.query);

      // TODO: Use req.user.id when auth is ready instead of query param
      const attendances = await AttendanceService.getMonthHistory(query.userId, query.month);

      ApiResponse.success(res, attendances);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/attendance/:id
   * Update an existing DailyAttendance record
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseBigIntParam(req.params.id, 'id');

      // Business rule: date cannot be changed on an existing attendance
      if (req.body.date !== undefined) {
        throw new AppError('VALIDATION_ERROR', 'Date cannot be changed on an existing attendance record', 400);
      }

      const body = updateAttendanceSchema.parse(req.body);

      // Get existing attendance for audit log
      const existing = await AttendanceService.getAttendanceById(id);

      await AttendanceService.updateAttendance(id, {
        startTime: body.startTime,
        endTime: body.endTime,
        status: body.status as DailyAttendanceStatus | undefined,
      });

      // Audit log after successful update
      logAudit({
        action: 'UPDATE_ATTENDANCE',
        userId: existing.userId,
        entity: 'DailyAttendance',
        entityId: id,
        payload: { startTime: body.startTime, endTime: body.endTime, status: body.status },
        req,
      });

      ApiResponse.success(res, { updated: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/combined
   * Create DailyAttendance + ProjectTimeLogs atomically (for work status only)
   */
  static async createCombined(req: Request, res: Response, next: NextFunction) {
    try {
      const body = combinedAttendanceSchema.parse(req.body);

      // TODO: Get userId from authenticated user (req.user.id) when auth is ready
      const userId = body.userId;

      const result = await CombinedAttendanceService.createCombined({
        userId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        timeLogs: body.timeLogs.map((log) => ({
          taskId: log.taskId,
          duration: log.duration,
          startTime: log.startTime,
          endTime: log.endTime,
          location: log.location as LocationStatus,
          description: log.description,
        })),
      });

      // Audit log after successful combined create
      logAudit({
        action: 'CREATE_COMBINED_ATTENDANCE',
        userId,
        entity: 'DailyAttendance',
        entityId: BigInt(result.attendanceId),
        payload: {
          date: body.date,
          startTime: body.startTime,
          endTime: body.endTime,
          status: 'work',
          timeLogsCount: body.timeLogs.length,
        },
        req,
      });

      ApiResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attendance/:id/document
   * Upload document to an attendance record (for sickness/reserves)
   */
  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseBigIntParam(req.params.id, 'id');

      // Validate file upload
      validateUploadedFile(req.file);

      const file = req.file!; // Safe after validation

      // Upload document to database
      await AttendanceService.uploadDocument(id, file.buffer);

      // Audit log
      const attendance = await AttendanceService.getAttendanceById(id);
      logAudit({
        action: 'UPLOAD_DOCUMENT',
        userId: attendance.userId,
        entity: 'DailyAttendance',
        entityId: id,
        payload: {
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
        req,
      });

      ApiResponse.success(res, {
        uploaded: true,
        fileName: file.originalname,
        fileSize: file.size,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/attendance/:id/document
   * Delete document from an attendance record
   */
  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseBigIntParam(req.params.id, 'id');

      // Get attendance for audit log
      const attendance = await AttendanceService.getAttendanceById(id);

      // Delete document from database
      await AttendanceService.deleteDocument(id);

      // Audit log
      logAudit({
        action: 'DELETE_DOCUMENT',
        userId: attendance.userId,
        entity: 'DailyAttendance',
        entityId: id,
        payload: {},
        req,
      });

      ApiResponse.success(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}
