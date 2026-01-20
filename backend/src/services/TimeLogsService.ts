import { LocationStatus, ReportingType } from '@prisma/client';
import { AppError } from '../middleware/ErrorHandler';
import {
  calculateDurationFromDates,
  calculateDurationMinutes,
  timeStringToDate,
  dateToTimeString,
  validateTimeRange,
  validateNoMidnightCrossing,
} from '../utils/TimeValidation';
import { prisma } from '../utils/prisma';

// ============================================================================
// Types
// ============================================================================

export interface CreateTimeLogData {
  dailyAttendanceId: bigint;
  taskId: bigint;
  duration?: number;           // Required for duration-based projects
  startTime?: string | null;   // Required for startEnd-based projects (HH:mm)
  endTime?: string | null;     // Required for startEnd-based projects (HH:mm)
  location: LocationStatus;
  description?: string | null;
}

export interface UpdateTimeLogData {
  taskId?: bigint;
  duration?: number;           // For duration-based projects
  startTime?: string | null;   // For startEnd-based projects (HH:mm)
  endTime?: string | null;     // For startEnd-based projects (HH:mm)
  location?: LocationStatus;
  description?: string | null;
}

export interface SerializedTimeLog {
  id: string;
  dailyAttendanceId: string;
  taskId: string;
  duration: number;
  startTime: string | null;    // HH:mm format or null
  endTime: string | null;      // HH:mm format or null
  location: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get total duration of all time logs for an attendance record
 * Optionally exclude a specific log (for updates)
 */
async function getTotalLogsDuration(
  dailyAttendanceId: bigint,
  excludeLogId?: bigint
): Promise<number> {
  const logs = await prisma.projectTimeLogs.findMany({
    where: {
      dailyAttendanceId,
      ...(excludeLogId ? { id: { not: excludeLogId } } : {}),
    },
    select: { durationMin: true },
  });

  return logs.reduce((sum, log) => sum + log.durationMin, 0);
}

/**
 * Check if attendance exists and return it
 */
async function getAttendanceOrThrow(dailyAttendanceId: bigint) {
  const attendance = await prisma.dailyAttendance.findUnique({
    where: { id: dailyAttendanceId },
  });

  if (!attendance) {
    throw new AppError('NOT_FOUND', 'Attendance record not found', 404);
  }

  return attendance;
}

/**
 * Check if task exists
 */
async function validateTaskExists(taskId: bigint): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new AppError('NOT_FOUND', 'Task not found', 404);
  }
}

/**
 * Get task with its project's reporting type
 */
async function getTaskWithProject(taskId: bigint): Promise<{
  task: { id: bigint; projectId: bigint };
  reportingType: ReportingType;
}> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: { reportingType: true },
      },
    },
  });

  if (!task) {
    throw new AppError('NOT_FOUND', 'Task not found', 404);
  }

  return {
    task: { id: task.id, projectId: task.projectId },
    reportingType: task.project.reportingType,
  };
}

/**
 * Calculate and validate time log fields based on reporting type
 * Returns the values to store in database
 */
function processTimeLogFields(
  reportingType: ReportingType,
  data: { duration?: number; startTime?: string | null; endTime?: string | null }
): { durationMin: number; startTime: Date | null; endTime: Date | null } {
  if (reportingType === 'startEnd') {
    // For startEnd projects: require startTime and endTime
    if (!data.startTime || !data.endTime) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Project requires startTime and endTime (reportingType=startEnd)',
        400
      );
    }

    // Validate time range and no midnight crossing
    validateTimeRange(data.startTime, data.endTime);
    validateNoMidnightCrossing(data.endTime);

    // Calculate duration from times
    const durationMin = calculateDurationMinutes(data.startTime, data.endTime);

    return {
      durationMin,
      startTime: timeStringToDate(data.startTime),
      endTime: timeStringToDate(data.endTime),
    };
  } else {
    // For duration projects: require duration
    if (data.duration === undefined || data.duration === null) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Project requires duration in minutes (reportingType=duration)',
        400
      );
    }

    validateDuration(data.duration);

    return {
      durationMin: data.duration,
      startTime: null,
      endTime: null,
    };
  }
}

/**
 * Validate duration is positive integer
 */
function validateDuration(duration: number): void {
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Duration must be a positive integer (minutes)', 400);
  }
}

/**
 * Validate location is one of the allowed values
 */
function validateLocation(location: string): void {
  const validLocations: LocationStatus[] = ['office', 'client', 'home'];
  if (!validLocations.includes(location as LocationStatus)) {
    throw new AppError('VALIDATION_ERROR', `Location must be one of: ${validLocations.join(', ')}`, 400);
  }
}

/**
 * Check the duration-vs-logs rule:
 * Total logs duration must be >= attendance duration (if attendance has times)
 * This is checked AFTER a mutation would occur
 */
async function checkDurationVsLogsRule(
  dailyAttendanceId: bigint,
  newTotalLogsDuration: number
): Promise<void> {
  const attendance = await getAttendanceOrThrow(dailyAttendanceId);
  
  // Only check if attendance has start/end times
  if (!attendance.startTime || !attendance.endTime) {
    return; // No constraint if attendance doesn't have times
  }

  const attendanceDuration = calculateDurationFromDates(attendance.startTime, attendance.endTime);

  // Rule: total logs must be >= attendance duration
  if (newTotalLogsDuration < attendanceDuration) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Total time logs (${newTotalLogsDuration} min) cannot be less than attendance duration (${attendanceDuration} min)`,
      400
    );
  }
}

// ============================================================================
// Service Methods
// ============================================================================

export class TimeLogsService {
  /**
   * Create a new time log
   * Handles both reportingType=duration and reportingType=startEnd projects
   */
  static async createTimeLog(data: CreateTimeLogData): Promise<bigint> {
    // Validate attendance exists
    await getAttendanceOrThrow(data.dailyAttendanceId);

    // Get task and project's reporting type
    const { reportingType } = await getTaskWithProject(data.taskId);

    // Validate location
    validateLocation(data.location);

    // Process time fields based on reporting type
    const { durationMin, startTime, endTime } = processTimeLogFields(reportingType, {
      duration: data.duration,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // Note: Overlapping time logs are allowed per API spec

    // Create the time log
    const timeLog = await prisma.projectTimeLogs.create({
      data: {
        dailyAttendanceId: data.dailyAttendanceId,
        taskId: data.taskId,
        durationMin,
        startTime,
        endTime,
        location: data.location,
        description: data.description || null,
      },
    });

    return timeLog.id;
  }

  /**
   * Get time logs by attendance ID
   */
  static async getTimeLogsByAttendance(dailyAttendanceId: bigint): Promise<SerializedTimeLog[]> {
    // Validate attendance exists
    await getAttendanceOrThrow(dailyAttendanceId);

    const logs = await prisma.projectTimeLogs.findMany({
      where: {
        dailyAttendanceId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Return flat list (no nested task/project/client per API spec)
    return logs.map((log) => ({
      id: log.id.toString(),
      dailyAttendanceId: log.dailyAttendanceId.toString(),
      taskId: log.taskId.toString(),
      duration: log.durationMin,
      startTime: log.startTime ? dateToTimeString(log.startTime) : null,
      endTime: log.endTime ? dateToTimeString(log.endTime) : null,
      location: log.location,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    }));
  }

  /**
   * Update an existing time log
   * Handles reportingType changes - requires appropriate fields based on current project type
   */
  static async updateTimeLog(id: bigint, data: UpdateTimeLogData): Promise<void> {
    // Check if time log exists
    const existing = await prisma.projectTimeLogs.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Time log not found', 404);
    }

    // Determine which task to use (new or existing)
    const taskId = data.taskId ?? existing.taskId;

    // Get the project's current reporting type
    const { reportingType } = await getTaskWithProject(taskId);

    // Check if time-related fields are being updated
    const hasTimeUpdate = data.duration !== undefined || data.startTime !== undefined || data.endTime !== undefined;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.taskId !== undefined) updateData.taskId = data.taskId;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.description !== undefined) updateData.description = data.description;

    // Handle time fields based on reporting type
    if (hasTimeUpdate) {
      // Merge with existing values for partial updates
      const mergedData = {
        duration: data.duration ?? existing.durationMin,
        startTime: data.startTime !== undefined 
          ? data.startTime 
          : (existing.startTime ? dateToTimeString(existing.startTime) : null),
        endTime: data.endTime !== undefined 
          ? data.endTime 
          : (existing.endTime ? dateToTimeString(existing.endTime) : null),
      };

      const { durationMin, startTime, endTime } = processTimeLogFields(reportingType, mergedData);

      // Check duration-vs-logs rule with new duration
      const currentTotal = await getTotalLogsDuration(existing.dailyAttendanceId, id);
      const newTotal = currentTotal + durationMin;
      await checkDurationVsLogsRule(existing.dailyAttendanceId, newTotal);

      updateData.durationMin = durationMin;
      updateData.startTime = startTime;
      updateData.endTime = endTime;
    }

    await prisma.projectTimeLogs.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a time log
   */
  static async deleteTimeLog(id: bigint): Promise<void> {
    // Check if time log exists
    const existing = await prisma.projectTimeLogs.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Time log not found', 404);
    }

    // Check duration-vs-logs rule before deletion
    const currentTotal = await getTotalLogsDuration(existing.dailyAttendanceId, id);
    // After deletion, total would be currentTotal (already excludes this log)
    await checkDurationVsLogsRule(existing.dailyAttendanceId, currentTotal);

    await prisma.projectTimeLogs.delete({
      where: { id },
    });
  }

  /**
   * Get time log by ID
   */
  static async getTimeLogById(id: bigint) {
    const timeLog = await prisma.projectTimeLogs.findUnique({
      where: { id },
    });

    if (!timeLog) {
      throw new AppError('NOT_FOUND', 'Time log not found', 404);
    }

    return timeLog;
  }

/**
   * Get total logs duration for an attendance
   */
  static async getTotalLogsDuration(dailyAttendanceId: bigint, excludeLogId?: bigint): Promise<number> {
    return getTotalLogsDuration(dailyAttendanceId, excludeLogId);
  }
}

// ============================================================================
// Exported Helpers (for testing)
// ============================================================================

export { validateDuration, validateLocation, getTaskWithProject, processTimeLogFields };
