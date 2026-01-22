import { z } from 'zod';

/**
 * Regex for HH:mm format (24-hour)
 */
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Zod schema for time string validation (HH:mm format)
 */
export const timeSchema = z.string().regex(TIME_REGEX, 'Time must be in HH:mm format (24-hour)');

/**
 * Schema for creating a new attendance record
 * POST /api/attendance
 * Note: userId is obtained from authenticated user, not from body
 */
export const createAttendanceSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Expected YYYY-MM-DD',
  }),
  startTime: timeSchema.optional().nullable(),
  endTime: timeSchema.optional().nullable(),
  status: z.enum(['work', 'sickness', 'reserves', 'dayOff', 'halfDayOff']),
});

/**
 * Schema for updating an existing attendance record
 * PUT /api/attendance/:id
 */
export const updateAttendanceSchema = z.object({
  startTime: timeSchema.optional().nullable(),
  endTime: timeSchema.optional().nullable(),
  status: z.enum(['work', 'sickness', 'reserves', 'dayOff', 'halfDayOff']).optional(),
});

/**
 * Schema for month history query parameters
 * GET /api/attendance/month-history
 * Note: userId is obtained from authenticated user, not from query params
 */
export const monthHistoryQuerySchema = z.object({
  month: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 1 && val <= 12, {
    message: 'Month must be between 1 and 12',
  }),
});

/**
 * Schema for combined attendance + time logs creation
 * POST /api/attendance/combined
 * Note: userId is obtained from authenticated user, not from body
 */
export const combinedAttendanceSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Expected YYYY-MM-DD',
  }),
  startTime: timeSchema,
  endTime: timeSchema,
  status: z.literal('work'),
  timeLogs: z.array(z.object({
    taskId: z.union([z.string(), z.number()]).transform((val) => BigInt(val)),
    duration: z.number().int().positive().optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    location: z.enum(['office', 'client', 'home']),
    description: z.string().optional(),
  })).min(1, 'At least one time log is required'),
});

// Type exports for use in services and controllers
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type MonthHistoryQuery = z.infer<typeof monthHistoryQuerySchema>;
export type CombinedAttendanceInput = z.infer<typeof combinedAttendanceSchema>;
