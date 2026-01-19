import { PrismaClient, LocationStatus } from '@prisma/client';
import { AppError } from '../middleware/ErrorHandler';
import { calculateDurationFromDates } from '../utils/TimeValidation';

const prisma = new PrismaClient();

// ============================================================================
// Types
// ============================================================================

export interface CreateTimeLogData {
  dailyAttendanceId: bigint;
  taskId: bigint;
  duration: number;
  location: LocationStatus;
  description?: string | null;
}

export interface UpdateTimeLogData {
  taskId?: bigint;
  duration?: number;
  location?: LocationStatus;
  description?: string | null;
}

export interface SerializedTimeLog {
  id: string;
  dailyAttendanceId: string;
  taskId: string;
  duration: number;
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
   */
  static async createTimeLog(data: CreateTimeLogData): Promise<bigint> {
    // Validate attendance exists
    await getAttendanceOrThrow(data.dailyAttendanceId);

    // Validate task exists
    await validateTaskExists(data.taskId);

    // Additional validations
    validateDuration(data.duration);
    validateLocation(data.location);

    // Note: Overlapping time logs are allowed per API spec

    // Create the time log
    const timeLog = await prisma.projectTimeLogs.create({
      data: {
        dailyAttendanceId: data.dailyAttendanceId,
        taskId: data.taskId,
        durationMin: data.duration,
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
      location: log.location,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    }));
  }

  /**
   * Update an existing time log
   */
  static async updateTimeLog(id: bigint, data: UpdateTimeLogData): Promise<void> {
    // Check if time log exists
    const existing = await prisma.projectTimeLogs.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Time log not found', 404);
    }

    // If taskId is being changed, validate new task exists
    if (data.taskId !== undefined) {
      await validateTaskExists(data.taskId);
    }

    // If duration is being changed, check duration-vs-logs rule
    if (data.duration !== undefined) {
      validateDuration(data.duration);

      // Calculate what total would be after update
      const currentTotal = await getTotalLogsDuration(existing.dailyAttendanceId, id);
      const newTotal = currentTotal + data.duration;

      await checkDurationVsLogsRule(existing.dailyAttendanceId, newTotal);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.taskId !== undefined) updateData.taskId = data.taskId;
    if (data.duration !== undefined) updateData.durationMin = data.duration;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.description !== undefined) updateData.description = data.description;

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

export { validateDuration, validateLocation };
