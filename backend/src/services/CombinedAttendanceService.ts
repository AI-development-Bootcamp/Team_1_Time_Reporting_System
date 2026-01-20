import { LocationStatus, ReportingType } from '@prisma/client';
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
import { prisma } from '../utils/prisma';

// Enable UTC plugin for consistent timezone handling
dayjs.extend(utc);

// ============================================================================
// Types
// ============================================================================

export interface TimeLogInput {
  taskId: bigint;
  duration?: number;           // For duration-based projects
  startTime?: string;          // For startEnd-based projects (HH:mm)
  endTime?: string;            // For startEnd-based projects (HH:mm)
  location: LocationStatus;
  description?: string;
}

export interface CombinedAttendanceInput {
  userId: bigint;
  date: string;                // YYYY-MM-DD
  startTime: string;           // HH:mm
  endTime: string;             // HH:mm
  timeLogs: TimeLogInput[];
}

export interface CombinedAttendanceResult {
  attendanceId: string;
  timeLogIds: string[];
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if an exclusive status (dayOff/sickness/reserves) exists on this date
 */
async function checkExclusiveStatusExists(
  prismaClient: typeof prisma,
  userId: bigint,
  date: Date
): Promise<void> {
  const exclusive = await prismaClient.dailyAttendance.findFirst({
    where: {
      userId,
      date,
      status: { in: ['dayOff', 'sickness', 'reserves'] },
    },
  });

  if (exclusive) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Cannot create work attendance - exclusive status (${exclusive.status}) already exists on this date`,
      400
    );
  }
}

/**
 * Check for overlap with existing work/halfDayOff attendances
 */
async function checkOverlap(
  prismaClient: typeof prisma,
  userId: bigint,
  date: Date,
  startTime: string,
  endTime: string
): Promise<void> {
  const existing = await prismaClient.dailyAttendance.findMany({
    where: {
      userId,
      date,
      status: { in: ['work', 'halfDayOff'] },
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
 * Validate a single time log and calculate its duration
 * Returns the duration in minutes and the processed time fields
 */
async function validateAndProcessTimeLog(
  prismaClient: typeof prisma,
  log: TimeLogInput,
  index: number
): Promise<{
  taskId: bigint;
  durationMin: number;
  startTime: Date | null;
  endTime: Date | null;
  location: LocationStatus;
  description: string | null;
}> {
  // Validate task exists and get project's reporting type
  const task = await prismaClient.task.findUnique({
    where: { id: log.taskId },
    include: {
      project: {
        select: { reportingType: true },
      },
    },
  });

  if (!task) {
    throw new AppError('NOT_FOUND', `Time log #${index + 1}: Task not found`, 404);
  }

  const reportingType = task.project.reportingType;

  // Validate location
  const validLocations: LocationStatus[] = ['office', 'client', 'home'];
  if (!validLocations.includes(log.location)) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Time log #${index + 1}: Location must be one of: ${validLocations.join(', ')}`,
      400
    );
  }

  // Process based on reporting type
  let durationMin: number;
  let startTimeDate: Date | null = null;
  let endTimeDate: Date | null = null;

  if (reportingType === 'startEnd') {
    // For startEnd projects: require startTime and endTime
    if (!log.startTime || !log.endTime) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Time log #${index + 1}: Project requires startTime and endTime (reportingType=startEnd)`,
        400
      );
    }

    // Validate time range and no midnight crossing
    validateTimeRange(log.startTime, log.endTime);
    validateNoMidnightCrossing(log.endTime);

    // Calculate duration
    durationMin = calculateDurationMinutes(log.startTime, log.endTime);
    startTimeDate = timeStringToDate(log.startTime);
    endTimeDate = timeStringToDate(log.endTime);
  } else {
    // For duration projects: require duration
    if (log.duration === undefined || log.duration === null) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Time log #${index + 1}: Project requires duration in minutes (reportingType=duration)`,
        400
      );
    }

    if (!Number.isInteger(log.duration) || log.duration <= 0) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Time log #${index + 1}: Duration must be a positive integer`,
        400
      );
    }

    durationMin = log.duration;
  }

  return {
    taskId: log.taskId,
    durationMin,
    startTime: startTimeDate,
    endTime: endTimeDate,
    location: log.location,
    description: log.description || null,
  };
}

// ============================================================================
// Service
// ============================================================================

export class CombinedAttendanceService {
  /**
   * Create attendance and time logs atomically in a single transaction
   * Validates all data before committing anything
   */
  static async createCombined(input: CombinedAttendanceInput): Promise<CombinedAttendanceResult> {
    const dateObj = dayjs.utc(input.date).toDate();
    const { userId, startTime, endTime, timeLogs } = input;

    // ========================================================================
    // Pre-transaction validations (read-only checks)
    // ========================================================================

    // Validation 1: Validate time range (endTime > startTime)
    validateTimeRange(startTime, endTime);

    // Validation 2: Validate no midnight crossing (endTime <= 23:59)
    validateNoMidnightCrossing(endTime);

    // Validation 3: Calculate attendance duration
    const attendanceDuration = calculateDurationMinutes(startTime, endTime);

    // ========================================================================
    // Transaction: all-or-nothing operation
    // ========================================================================

    return await prisma.$transaction(async (tx) => {
      // Validation 4: Check no exclusive status exists on date
      await checkExclusiveStatusExists(tx as typeof prisma, userId, dateObj);

      // Validation 5: Check no overlap with existing work/halfDayOff attendances
      await checkOverlap(tx as typeof prisma, userId, dateObj, startTime, endTime);

      // Validation 6 & 7: Validate all time logs and calculate total duration
      const processedLogs = await Promise.all(
        timeLogs.map((log, index) =>
          validateAndProcessTimeLog(tx as typeof prisma, log, index)
        )
      );

      // Validation 8: Validate sumOfTimeLogs >= attendanceDuration
      const totalLogsDuration = processedLogs.reduce((sum, log) => sum + log.durationMin, 0);

      if (totalLogsDuration < attendanceDuration) {
        throw new AppError(
          'VALIDATION_ERROR',
          `Total time logs (${totalLogsDuration} min) must be >= attendance duration (${attendanceDuration} min)`,
          400
        );
      }

      // ======================================================================
      // Create Step 1: Create DailyAttendance record
      // ======================================================================
      const attendance = await tx.dailyAttendance.create({
        data: {
          userId,
          date: dateObj,
          startTime: timeStringToDate(startTime),
          endTime: timeStringToDate(endTime),
          status: 'work',
        },
      });

      // ======================================================================
      // Create Step 2: Create all ProjectTimeLogs records
      // ======================================================================
      const timeLogRecords = await Promise.all(
        processedLogs.map((log) =>
          tx.projectTimeLogs.create({
            data: {
              dailyAttendanceId: attendance.id,
              taskId: log.taskId,
              durationMin: log.durationMin,
              startTime: log.startTime,
              endTime: log.endTime,
              location: log.location,
              description: log.description,
            },
          })
        )
      );

      return {
        attendanceId: attendance.id.toString(),
        timeLogIds: timeLogRecords.map((log) => log.id.toString()),
      };
    });
  }
}
