import { z } from 'zod';

/**
 * Regex for HH:mm format (24-hour)
 */
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Zod schema for time string validation (HH:mm format)
 */
const timeSchema = z.string().regex(TIME_REGEX, 'Time must be in HH:mm format (24-hour)');

/**
 * Schema for creating a new time log
 * POST /api/time-logs
 */
export const createTimeLogSchema = z.object({
  dailyAttendanceId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  taskId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
  duration: z.number().int().positive('Duration must be a positive integer').optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  location: z.enum(['office', 'client', 'home']),
  description: z.string().optional(),
});

/**
 * Schema for updating an existing time log
 * PUT /api/time-logs/:id
 */
export const updateTimeLogSchema = z.object({
  taskId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)).optional(),
  duration: z.number().int().positive('Duration must be a positive integer').optional(),
  startTime: timeSchema.optional().nullable(),
  endTime: timeSchema.optional().nullable(),
  location: z.enum(['office', 'client', 'home']).optional(),
  description: z.string().optional().nullable(),
});

/**
 * Schema for time logs query parameters
 * GET /api/time-logs?dailyAttendanceId=X
 */
export const queryTimeLogsSchema = z.object({
  dailyAttendanceId: z.string().transform((val) => BigInt(val)),
});

// Type exports for use in services and controllers
export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;
export type QueryTimeLogsInput = z.infer<typeof queryTimeLogsSchema>;
