import { Request, Response, NextFunction } from 'express';
import { DailyAttendanceStatus } from '@prisma/client';
import { AttendanceService } from '../services/AttendanceService';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { logAudit } from '../utils/AuditLog';
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  monthHistoryQuerySchema,
} from '../validators/attendance.schema';

export class AttendanceController {
  /**
   * POST /api/attendance
   * Create a new DailyAttendance record
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createAttendanceSchema.parse(req.body);

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
      const id = BigInt(req.params.id);

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
}
