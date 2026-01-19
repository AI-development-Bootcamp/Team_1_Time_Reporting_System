import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, DailyAttendanceStatus } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';
import { logAudit } from '../utils/AuditLog';

// Enable UTC plugin for consistent timezone handling
dayjs.extend(utc);

const router = Router();
const prisma = new PrismaClient();

// ============================================================================
// Time Helpers
// ============================================================================

/**
 * Regex for HH:mm format (24-hour)
 */
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Convert HH:mm string to a Date anchored at 1970-01-01 UTC
 * This ensures consistent storage in PostgreSQL TIME column
 */
function timeStringToDate(time: string): Date {
  const match = time.match(TIME_REGEX);
  if (!match) {
    throw new AppError('VALIDATION_ERROR', `Invalid time format: ${time}. Expected HH:mm`, 400);
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

/**
 * Convert Date (from Prisma TIME column) to HH:mm string
 */
function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculate duration in minutes between two HH:mm times
 */
function calculateDurationMinutes(startTime: string, endTime: string): number {
  const startMatch = startTime.match(TIME_REGEX);
  const endMatch = endTime.match(TIME_REGEX);
  if (!startMatch || !endMatch) return 0;

  const startMinutes = parseInt(startMatch[1], 10) * 60 + parseInt(startMatch[2], 10);
  const endMinutes = parseInt(endMatch[1], 10) * 60 + parseInt(endMatch[2], 10);
  return endMinutes - startMinutes;
}

/**
 * Check if two time ranges overlap
 * Returns true if they overlap
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseInt(start1.replace(':', ''), 10);
  const e1 = parseInt(end1.replace(':', ''), 10);
  const s2 = parseInt(start2.replace(':', ''), 10);
  const e2 = parseInt(end2.replace(':', ''), 10);

  // Ranges overlap if one starts before the other ends
  return s1 < e2 && s2 < e1;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a new attendance record overlaps with existing ones on the same date
 * @param userId User ID
 * @param date Date to check
 * @param startTime Start time (HH:mm)
 * @param endTime End time (HH:mm)
 * @param excludeId Optional ID to exclude (for updates)
 */
async function checkOverlap(
  userId: bigint,
  date: Date,
  startTime: string | null,
  endTime: string | null,
  excludeId?: bigint
): Promise<void> {
  // If no times provided, no overlap check needed
  if (!startTime || !endTime) return;

  // Get all attendance records for this user on this date
  const existing = await prisma.dailyAttendance.findMany({
    where: {
      userId,
      date,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  for (const record of existing) {
    if (record.startTime && record.endTime) {
      const existingStart = dateToTimeString(record.startTime);
      const existingEnd = dateToTimeString(record.endTime);

      if (timeRangesOverlap(startTime, endTime, existingStart, existingEnd)) {
        throw new AppError(
          'VALIDATION_ERROR',
          `Time range ${startTime}-${endTime} overlaps with existing attendance ${existingStart}-${existingEnd}`,
          400
        );
      }
    }
  }
}

/**
 * Check if total ProjectTimeLogs minutes >= attendance duration
 * Used on attendance update when time range changes
 */
async function checkDurationVsLogs(
  attendanceId: bigint,
  startTime: string,
  endTime: string
): Promise<void> {
  const attendanceDuration = calculateDurationMinutes(startTime, endTime);

  const logs = await prisma.projectTimeLogs.findMany({
    where: { dailyAttendanceId: attendanceId },
    select: { durationMin: true },
  });

  const totalLogMinutes = logs.reduce((sum, log) => sum + log.durationMin, 0);

  if (totalLogMinutes < attendanceDuration) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Total project time logs (${totalLogMinutes} min) must be >= attendance duration (${attendanceDuration} min)`,
      400
    );
  }
}

/**
 * Validate attendance data before save
 * Combines all validation rules
 */
export async function validateAttendance(
  userId: bigint,
  date: Date,
  startTime: string | null,
  endTime: string | null,
  status: string,
  excludeId?: bigint
): Promise<void> {
  // For work status, times are required
  if (status === 'work') {
    if (!startTime || !endTime) {
      throw new AppError('VALIDATION_ERROR', 'Start time and end time are required for work status', 400);
    }
  }

  // Validate endTime > startTime
  if (startTime && endTime) {
    const duration = calculateDurationMinutes(startTime, endTime);
    if (duration <= 0) {
      throw new AppError('VALIDATION_ERROR', 'End time must be after start time', 400);
    }
  }

  // Check for overlapping attendance
  await checkOverlap(userId, date, startTime, endTime, excludeId);
}

// ============================================================================
// Zod Schemas
// ============================================================================

const timeSchema = z.string().regex(TIME_REGEX, 'Time must be in HH:mm format (24-hour)');

const createAttendanceSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Expected YYYY-MM-DD',
  }),
  startTime: timeSchema.optional().nullable(),
  endTime: timeSchema.optional().nullable(),
  status: z.enum(['work', 'sickness', 'reserves', 'dayOff', 'halfDayOff']),
  userId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
});

const updateAttendanceSchema = z.object({
  startTime: timeSchema.optional().nullable(),
  endTime: timeSchema.optional().nullable(),
  status: z.enum(['work', 'sickness', 'reserves', 'dayOff', 'halfDayOff']).optional(),
});

const monthHistoryQuerySchema = z.object({
  month: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 1 && val <= 12, {
    message: 'Month must be between 1 and 12',
  }),
  userId: z.string().transform((val) => BigInt(val)),
});

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * POST /api/attendance
 * Create a new DailyAttendance record
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createAttendanceSchema.parse(req.body);

    // TODO: Get userId from authenticated user (req.user.id) when auth is ready
    const userId = body.userId;
    const dateObj = dayjs.utc(body.date).toDate(); // Use UTC to avoid timezone shifts
    const startTime = body.startTime || null;
    const endTime = body.endTime || null;

    // Run all validations
    await validateAttendance(userId, dateObj, startTime, endTime, body.status);

    const attendance = await prisma.dailyAttendance.create({
      data: {
        userId,
        date: dateObj,
        startTime: startTime ? timeStringToDate(startTime) : null,
        endTime: endTime ? timeStringToDate(endTime) : null,
        status: body.status as DailyAttendanceStatus,
      },
    });

    // Audit log after successful create
    logAudit({
      action: 'CREATE_ATTENDANCE',
      userId,
      entity: 'DailyAttendance',
      entityId: attendance.id,
      payload: { date: body.date, startTime, endTime, status: body.status },
      req,
    });

    ApiResponse.success(res, { id: attendance.id.toString() }, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/attendance/month-history
 * Get attendance records for a specific month
 */
router.get('/month-history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = monthHistoryQuerySchema.parse(req.query);

    // Use current year with UTC to avoid timezone issues
    const year = dayjs.utc().year();
    const startDate = dayjs.utc().year(year).month(query.month - 1).date(1).startOf('day').toDate();
    const endDate = dayjs.utc().year(year).month(query.month - 1).endOf('month').toDate();

    const attendances = await prisma.dailyAttendance.findMany({
      where: {
        userId: query.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        projectTimeLogs: {
          include: {
            task: {
              include: {
                project: {
                  include: {
                    client: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Transform BigInt to string and format times as HH:mm
    const serializedAttendances = attendances.map((attendance) => ({
      id: attendance.id.toString(),
      userId: attendance.userId.toString(),
      date: attendance.date.toISOString().split('T')[0],
      startTime: attendance.startTime ? dateToTimeString(attendance.startTime) : null,
      endTime: attendance.endTime ? dateToTimeString(attendance.endTime) : null,
      status: attendance.status,
      document: attendance.document ? true : null, // Don't send binary, just indicate presence
      createdAt: attendance.createdAt.toISOString(),
      updatedAt: attendance.updatedAt.toISOString(),
      projectTimeLogs: attendance.projectTimeLogs.map((log) => ({
        id: log.id.toString(),
        dailyAttendanceId: log.dailyAttendanceId.toString(),
        taskId: log.taskId.toString(),
        duration: log.durationMin, // API spec uses "duration" not "durationMin"
        location: log.location,
        description: log.description,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
        task: {
          id: log.task.id.toString(),
          name: log.task.name,
          project: {
            id: log.task.project.id.toString(),
            name: log.task.project.name,
            client: {
              id: log.task.project.client.id.toString(),
              name: log.task.project.client.name,
            },
          },
        },
      })),
    }));

    ApiResponse.success(res, serializedAttendances);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/attendance/:id
 * Update an existing DailyAttendance record
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);

    // Business rule: date cannot be changed on an existing attendance
    if (req.body.date !== undefined) {
      throw new AppError('VALIDATION_ERROR', 'Date cannot be changed on an existing attendance record', 400);
    }

    const body = updateAttendanceSchema.parse(req.body);

    // Check if attendance exists
    const existing = await prisma.dailyAttendance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Attendance record not found', 404);
    }

    // Determine final values (merge with existing)
    const newStatus = body.status || existing.status;

    // Handle time updates
    let newStartTime: string | null = null;
    let newEndTime: string | null = null;

    if (body.startTime !== undefined) {
      newStartTime = body.startTime;
    } else if (existing.startTime) {
      newStartTime = dateToTimeString(existing.startTime);
    }

    if (body.endTime !== undefined) {
      newEndTime = body.endTime;
    } else if (existing.endTime) {
      newEndTime = dateToTimeString(existing.endTime);
    }

    // Run validations (exclude current record from overlap check)
    await validateAttendance(existing.userId, existing.date, newStartTime, newEndTime, newStatus, id);

    // If time range is being changed, check duration-vs-logs
    const timeChanged = body.startTime !== undefined || body.endTime !== undefined;
    if (timeChanged && newStartTime && newEndTime) {
      await checkDurationVsLogs(id, newStartTime, newEndTime);
    }

    // Build update data (date is not allowed to be updated)
    const updateData: Record<string, unknown> = {};
    if (body.startTime !== undefined) {
      updateData.startTime = body.startTime ? timeStringToDate(body.startTime) : null;
    }
    if (body.endTime !== undefined) {
      updateData.endTime = body.endTime ? timeStringToDate(body.endTime) : null;
    }
    if (body.status !== undefined) updateData.status = body.status as DailyAttendanceStatus;

    await prisma.dailyAttendance.update({
      where: { id },
      data: updateData,
    });

    // Audit log after successful update
    logAudit({
      action: 'UPDATE_ATTENDANCE',
      userId: existing.userId,
      entity: 'DailyAttendance',
      entityId: id,
      payload: { startTime: newStartTime, endTime: newEndTime, status: newStatus },
      req,
    });

    ApiResponse.success(res, { updated: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Exported Helpers (for use in TimeLogs route)
// ============================================================================

export {
  calculateDurationMinutes,
  checkDurationVsLogs,
  timeStringToDate,
  dateToTimeString,
  timeRangesOverlap,
};

export default router;
