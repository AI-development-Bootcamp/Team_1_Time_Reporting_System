import { Response, NextFunction } from 'express';
import { DailyAttendanceStatus, LocationStatus } from '@prisma/client';
import { AttendanceService } from '../services/AttendanceService';
import { CombinedAttendanceService } from '../services/CombinedAttendanceService';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { logAudit } from '../utils/AuditLog';
import { parseBigIntParam } from '../utils/paramValidation';
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
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = createAttendanceSchema.parse(req.body);

      if (body.status === 'work') {
        throw new AppError(
          'VALIDATION_ERROR',
          'Work attendance must be submitted via /api/attendance/combined',
          400
        );
      }

      // Get userId from authenticated user
      const userId = req.userId!;

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
  static async getMonthHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = monthHistoryQuerySchema.parse(req.query);

      // Use authenticated user's ID
      const attendances = await AttendanceService.getMonthHistory(req.userId!, query.month);

      ApiResponse.success(res, attendances);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/attendance/:id
   * Update an existing DailyAttendance record
   */
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
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
  static async createCombined(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = combinedAttendanceSchema.parse(req.body);

      // Get userId from authenticated user
      const userId = req.userId!;

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
}
