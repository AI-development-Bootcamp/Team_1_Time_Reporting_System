import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient, LocationStatus } from '@prisma/client';
import { ApiResponse } from '../utils/Response';
import { AppError } from '../middleware/ErrorHandler';

const router = Router();
const prisma = new PrismaClient();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate duration in minutes between two Date objects (TIME columns)
 */
function calculateAttendanceDuration(startTime: Date | null, endTime: Date | null): number {
  if (!startTime || !endTime) return 0;
  
  const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
  const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
  return endMinutes - startMinutes;
}

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

  const attendanceDuration = calculateAttendanceDuration(attendance.startTime, attendance.endTime);

  // Rule: total logs must be >= attendance duration
  // But wait - the spec says we should BLOCK if logs would become < attendance duration
  // This means after DELETE/UPDATE, we need logs >= attendance
  // Actually re-reading: "Block if total logs would become < attendance duration"
  // So after the mutation, if logs < attendance → reject
  if (newTotalLogsDuration < attendanceDuration) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Total time logs (${newTotalLogsDuration} min) cannot be less than attendance duration (${attendanceDuration} min)`,
      400
    );
  }
}

// ============================================================================
// Zod Schemas
// ============================================================================

const createTimeLogSchema = z.object({
  dailyAttendanceId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  taskId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  duration: z.number().int().positive('Duration must be a positive integer'),
  location: z.enum(['office', 'client', 'home']),
  description: z.string().optional(),
});

const updateTimeLogSchema = z.object({
  taskId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)).optional(),
  duration: z.number().int().positive('Duration must be a positive integer').optional(),
  location: z.enum(['office', 'client', 'home']).optional(),
  description: z.string().optional().nullable(),
});

const queryTimeLogsSchema = z.object({
  dailyAttendanceId: z.string().transform((val) => BigInt(val)),
});

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * POST /api/time-logs
 * Create a new time log entry
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createTimeLogSchema.parse(req.body);

    // Validate attendance exists
    await getAttendanceOrThrow(body.dailyAttendanceId);

    // Validate task exists
    await validateTaskExists(body.taskId);

    // Additional validations (Zod handles most, but explicit for clarity)
    validateDuration(body.duration);
    validateLocation(body.location);

    // Note: Overlapping time logs are allowed per API spec

    // Create the time log
    const timeLog = await prisma.projectTimeLogs.create({
      data: {
        dailyAttendanceId: body.dailyAttendanceId,
        taskId: body.taskId,
        durationMin: body.duration,
        location: body.location as LocationStatus,
        description: body.description || null,
      },
    });

    ApiResponse.success(res, { id: timeLog.id.toString() }, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/time-logs?dailyAttendanceId=X
 * List time logs for a specific attendance record
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = queryTimeLogsSchema.parse(req.query);

    // Validate attendance exists
    await getAttendanceOrThrow(query.dailyAttendanceId);

    const logs = await prisma.projectTimeLogs.findMany({
      where: {
        dailyAttendanceId: query.dailyAttendanceId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Return flat list (no nested task/project/client per API spec)
    const serializedLogs = logs.map((log) => ({
      id: log.id.toString(),
      dailyAttendanceId: log.dailyAttendanceId.toString(),
      taskId: log.taskId.toString(),
      duration: log.durationMin,
      location: log.location,
      description: log.description,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    }));

    ApiResponse.success(res, serializedLogs);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/time-logs/:id
 * Update an existing time log
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const body = updateTimeLogSchema.parse(req.body);

    // Check if time log exists
    const existing = await prisma.projectTimeLogs.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Time log not found', 404);
    }

    // If taskId is being changed, validate new task exists
    if (body.taskId !== undefined) {
      await validateTaskExists(body.taskId);
    }

    // If duration is being changed, check duration-vs-logs rule
    if (body.duration !== undefined) {
      validateDuration(body.duration);

      // Calculate what total would be after update
      const currentTotal = await getTotalLogsDuration(existing.dailyAttendanceId, id);
      const newTotal = currentTotal + body.duration;

      await checkDurationVsLogsRule(existing.dailyAttendanceId, newTotal);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (body.taskId !== undefined) updateData.taskId = body.taskId;
    if (body.duration !== undefined) updateData.durationMin = body.duration;
    if (body.location !== undefined) updateData.location = body.location as LocationStatus;
    if (body.description !== undefined) updateData.description = body.description;

    await prisma.projectTimeLogs.update({
      where: { id },
      data: updateData,
    });

    ApiResponse.success(res, { updated: true });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/time-logs/:id
 * Delete a time log
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);

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

    ApiResponse.success(res, { deleted: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Exported Helpers (for testing and other routes)
// ============================================================================

export {
  validateDuration,
  validateLocation,
  calculateAttendanceDuration,
  getTotalLogsDuration,
};

export default router;
