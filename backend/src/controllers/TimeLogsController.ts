import { Request, Response, NextFunction } from 'express';
import { LocationStatus } from '@prisma/client';
import { TimeLogsService } from '../services/TimeLogsService';
import { ApiResponse } from '../utils/Response';
import {
  createTimeLogSchema,
  updateTimeLogSchema,
  queryTimeLogsSchema,
} from '../validators/timeLogs.schema';

export class TimeLogsController {
  /**
   * POST /api/time-logs
   * Create a new time log entry
   * Supports both reportingType=duration (requires duration) and reportingType=startEnd (requires startTime/endTime)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createTimeLogSchema.parse(req.body);

      const id = await TimeLogsService.createTimeLog({
        dailyAttendanceId: body.dailyAttendanceId,
        taskId: body.taskId,
        duration: body.duration,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location as LocationStatus,
        description: body.description,
      });

      ApiResponse.success(res, { id: id.toString() }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/time-logs?dailyAttendanceId=X
   * List time logs for a specific attendance record
   */
  static async getByAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const query = queryTimeLogsSchema.parse(req.query);

      const logs = await TimeLogsService.getTimeLogsByAttendance(query.dailyAttendanceId);

      ApiResponse.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/time-logs/:id
   * Update an existing time log
   * Supports both reportingType=duration and reportingType=startEnd based on current project settings
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = BigInt(req.params.id);
      const body = updateTimeLogSchema.parse(req.body);

      await TimeLogsService.updateTimeLog(id, {
        taskId: body.taskId,
        duration: body.duration,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location as LocationStatus | undefined,
        description: body.description,
      });

      ApiResponse.success(res, { updated: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/time-logs/:id
   * Delete a time log
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = BigInt(req.params.id);

      await TimeLogsService.deleteTimeLog(id);

      ApiResponse.success(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }
}
