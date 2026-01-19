import { PrismaClient, DailyAttendanceStatus } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { AppError } from '../middleware/ErrorHandler';
import {
  timeStringToDate,
  dateToTimeString,
  calculateDurationMinutes,
  timeRangesOverlap,
  validateTimeRange,
  validateNoMidnightCrossing,
} from '../utils/TimeValidation';

// Enable UTC plugin for consistent timezone handling
dayjs.extend(utc);

const prisma = new PrismaClient();

// ============================================================================
// Types
// ============================================================================

export interface CreateAttendanceData {
  userId: bigint;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: DailyAttendanceStatus;
}

export interface UpdateAttendanceData {
  startTime?: string | null;
  endTime?: string | null;
  status?: DailyAttendanceStatus;
}

export interface AttendanceWithLogs {
  id: string;
  userId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: DailyAttendanceStatus;
  document: boolean | null;
  createdAt: string;
  updatedAt: string;
  projectTimeLogs: Array<{
    id: string;
    dailyAttendanceId: string;
    taskId: string;
    duration: number;
    location: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    task: {
      id: string;
      name: string;
      project: {
        id: string;
        name: string;
        client: {
          id: string;
          name: string;
        };
      };
    };
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const EXCLUSIVE_STATUSES: DailyAttendanceStatus[] = ['dayOff', 'sickness', 'reserves'];
const NON_WORK_STATUSES: DailyAttendanceStatus[] = ['dayOff', 'sickness', 'reserves', 'halfDayOff'];

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if an exclusive status (dayOff/sickness/reserves) exists on this date
 * Returns the status if found, null otherwise
 */
async function checkExclusiveStatusExists(
  userId: bigint,
  date: Date,
  excludeId?: bigint
): Promise<DailyAttendanceStatus | null> {
  const exclusive = await prisma.dailyAttendance.findFirst({
    where: {
      userId,
      date,
      status: { in: EXCLUSIVE_STATUSES },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  return exclusive?.status || null;
}

/**
 * Check if any attendance exists on this date
 * Returns true if any attendance exists
 */
async function checkAnyAttendanceExists(
  userId: bigint,
  date: Date,
  excludeId?: bigint
): Promise<boolean> {
  const count = await prisma.dailyAttendance.count({
    where: {
      userId,
      date,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  return count > 0;
}

/**
 * Get count of time logs for an attendance record
 */
async function getTimeLogsCount(attendanceId: bigint): Promise<number> {
  return prisma.projectTimeLogs.count({
    where: { dailyAttendanceId: attendanceId },
  });
}

/**
 * Check if a new attendance record overlaps with existing ones on the same date
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
 * Combines all validation rules based on status
 */
export async function validateAttendance(
  userId: bigint,
  date: Date,
  startTime: string | null,
  endTime: string | null,
  status: DailyAttendanceStatus,
  excludeId?: bigint
): Promise<void> {
  // ==========================================================================
  // Status-specific validation rules
  // ==========================================================================

  if (status === 'work') {
    // Work status requires times
    if (!startTime || !endTime) {
      throw new AppError('VALIDATION_ERROR', 'Start time and end time are required for work status', 400);
    }

    // Check no exclusive status exists on this date
    const existingExclusive = await checkExclusiveStatusExists(userId, date, excludeId);
    if (existingExclusive) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Cannot add work attendance - exclusive status (${existingExclusive}) already exists on this date`,
        400
      );
    }
  } else if (status === 'halfDayOff') {
    // halfDayOff can coexist with work, but not with exclusive statuses
    const existingExclusive = await checkExclusiveStatusExists(userId, date, excludeId);
    if (existingExclusive) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Cannot add halfDayOff - exclusive status (${existingExclusive}) already exists on this date`,
        400
      );
    }
  } else if (EXCLUSIVE_STATUSES.includes(status)) {
    // Exclusive statuses (dayOff/sickness/reserves) cannot coexist with ANY other attendance
    const anyExists = await checkAnyAttendanceExists(userId, date, excludeId);
    if (anyExists) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Cannot add ${status} - other attendance already exists on this date`,
        400
      );
    }
  }

  // ==========================================================================
  // Time validation (only if times are provided)
  // ==========================================================================

  if (startTime && endTime) {
    // Validate time range (endTime > startTime)
    validateTimeRange(startTime, endTime);

    // Validate no midnight crossing (endTime <= 23:59)
    validateNoMidnightCrossing(endTime);

    // Check for overlapping attendance
    await checkOverlap(userId, date, startTime, endTime, excludeId);
  }
}

// ============================================================================
// Service Methods
// ============================================================================

export class AttendanceService {
  /**
   * Create a new attendance record
   */
  static async createAttendance(data: CreateAttendanceData): Promise<bigint> {
    const dateObj = dayjs.utc(data.date).toDate();
    const startTime = data.startTime || null;
    const endTime = data.endTime || null;

    // Run all validations
    await validateAttendance(data.userId, dateObj, startTime, endTime, data.status);

    const attendance = await prisma.dailyAttendance.create({
      data: {
        userId: data.userId,
        date: dateObj,
        startTime: startTime ? timeStringToDate(startTime) : null,
        endTime: endTime ? timeStringToDate(endTime) : null,
        status: data.status,
      },
    });

    return attendance.id;
  }

  /**
   * Get month history for a user
   */
  static async getMonthHistory(userId: bigint, month: number): Promise<AttendanceWithLogs[]> {
    // Use current year with UTC to avoid timezone issues
    const year = dayjs.utc().year();
    const startDate = dayjs.utc().year(year).month(month - 1).date(1).startOf('day').toDate();
    const endDate = dayjs.utc().year(year).month(month - 1).endOf('month').toDate();

    const attendances = await prisma.dailyAttendance.findMany({
      where: {
        userId,
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
    return attendances.map((attendance) => ({
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
  }

  /**
   * Update an existing attendance record
   * Handles status change validations including:
   * - Work → Non-work: Block if time logs exist
   * - Non-work → Work: Require startTime/endTime
   * - Any → Exclusive: Check no other records exist
   */
  static async updateAttendance(id: bigint, data: UpdateAttendanceData): Promise<void> {
    // Check if attendance exists
    const existing = await prisma.dailyAttendance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Attendance record not found', 404);
    }

    // Determine final values (merge with existing)
    const oldStatus = existing.status;
    const newStatus = data.status || existing.status;
    const statusChanging = data.status !== undefined && data.status !== oldStatus;

    // ==========================================================================
    // Status change validations
    // ==========================================================================

    if (statusChanging) {
      const oldIsWork = oldStatus === 'work';
      const newIsWork = newStatus === 'work';
      const newIsNonWork = NON_WORK_STATUSES.includes(newStatus);

      // Work → Non-work: Block if time logs exist
      if (oldIsWork && newIsNonWork) {
        const logsCount = await getTimeLogsCount(id);
        if (logsCount > 0) {
          throw new AppError(
            'VALIDATION_ERROR',
            `Cannot change to ${newStatus} status while time logs exist (${logsCount} logs). Delete time logs first.`,
            400
          );
        }
      }

      // Non-work → Work: Require startTime/endTime in request
      if (!oldIsWork && newIsWork) {
        if (!data.startTime || !data.endTime) {
          throw new AppError(
            'VALIDATION_ERROR',
            'Start time and end time are required when changing to work status',
            400
          );
        }
      }
    }

    // ==========================================================================
    // Handle time updates
    // ==========================================================================

    let newStartTime: string | null = null;
    let newEndTime: string | null = null;

    if (data.startTime !== undefined) {
      newStartTime = data.startTime;
    } else if (existing.startTime) {
      newStartTime = dateToTimeString(existing.startTime);
    }

    if (data.endTime !== undefined) {
      newEndTime = data.endTime;
    } else if (existing.endTime) {
      newEndTime = dateToTimeString(existing.endTime);
    }

    // For non-work statuses, clear times
    if (NON_WORK_STATUSES.includes(newStatus)) {
      newStartTime = null;
      newEndTime = null;
    }

    // Run validations (exclude current record from overlap check)
    await validateAttendance(existing.userId, existing.date, newStartTime, newEndTime, newStatus, id);

    // If time range is being changed and OLD status was work, check duration-vs-logs
    // (Don't check if changing FROM non-work TO work - there are no logs yet)
    const timeChanged = data.startTime !== undefined || data.endTime !== undefined;
    const wasWork = oldStatus === 'work';
    if (timeChanged && newStartTime && newEndTime && newStatus === 'work' && wasWork) {
      await checkDurationVsLogs(id, newStartTime, newEndTime);
    }

    // ==========================================================================
    // Build update data (date is not allowed to be updated)
    // ==========================================================================

    const updateData: Record<string, unknown> = {};

    // For non-work statuses, always clear times
    if (NON_WORK_STATUSES.includes(newStatus)) {
      updateData.startTime = null;
      updateData.endTime = null;
    } else {
      if (data.startTime !== undefined) {
        updateData.startTime = data.startTime ? timeStringToDate(data.startTime) : null;
      }
      if (data.endTime !== undefined) {
        updateData.endTime = data.endTime ? timeStringToDate(data.endTime) : null;
      }
    }

    if (data.status !== undefined) updateData.status = data.status;

    await prisma.dailyAttendance.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Get attendance by ID
   */
  static async getAttendanceById(id: bigint) {
    const attendance = await prisma.dailyAttendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new AppError('NOT_FOUND', 'Attendance record not found', 404);
    }

    return attendance;
  }

  /**
   * Validate ownership - check if attendance belongs to user
   * Prepared for auth integration
   */
  static async validateOwnership(attendanceId: bigint, userId: bigint): Promise<void> {
    const attendance = await prisma.dailyAttendance.findUnique({
      where: { id: attendanceId },
    });
    
    if (!attendance || attendance.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }
  }
}
