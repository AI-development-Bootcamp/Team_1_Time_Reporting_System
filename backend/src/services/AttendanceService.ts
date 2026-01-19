import { PrismaClient, DailyAttendanceStatus } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { AppError } from '../middleware/ErrorHandler';
import {
  timeStringToDate,
  dateToTimeString,
  calculateDurationMinutes,
  timeRangesOverlap,
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
// Validation Helpers
// ============================================================================

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
    const newStatus = data.status || existing.status;

    // Handle time updates
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

    // Run validations (exclude current record from overlap check)
    await validateAttendance(existing.userId, existing.date, newStartTime, newEndTime, newStatus, id);

    // If time range is being changed, check duration-vs-logs
    const timeChanged = data.startTime !== undefined || data.endTime !== undefined;
    if (timeChanged && newStartTime && newEndTime) {
      await checkDurationVsLogs(id, newStartTime, newEndTime);
    }

    // Build update data (date is not allowed to be updated)
    const updateData: Record<string, unknown> = {};
    if (data.startTime !== undefined) {
      updateData.startTime = data.startTime ? timeStringToDate(data.startTime) : null;
    }
    if (data.endTime !== undefined) {
      updateData.endTime = data.endTime ? timeStringToDate(data.endTime) : null;
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
