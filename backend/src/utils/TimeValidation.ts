import { AppError } from '../middleware/ErrorHandler';

/**
 * Regex for HH:mm format (24-hour)
 */
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Convert HH:mm string to a Date anchored at 1970-01-01 UTC
 * This ensures consistent storage in PostgreSQL TIME column
 */
export function timeStringToDate(time: string): Date {
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
export function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculate duration in minutes between two HH:mm times
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
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
export function timeRangesOverlap(
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

/**
 * Validate that endTime > startTime
 * Throws AppError if validation fails
 */
export function validateTimeRange(startTime: string, endTime: string): void {
  const duration = calculateDurationMinutes(startTime, endTime);
  if (duration <= 0) {
    throw new AppError('VALIDATION_ERROR', 'End time must be after start time', 400);
  }
}

/**
 * Validate that endTime does not exceed 23:59 (no midnight crossing)
 * Throws AppError if validation fails
 */
export function validateNoMidnightCrossing(endTime: string): void {
  const match = endTime.match(TIME_REGEX);
  if (!match) {
    throw new AppError('VALIDATION_ERROR', `Invalid time format: ${endTime}. Expected HH:mm`, 400);
  }
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  // Max allowed is 23:59
  if (hours > 23 || (hours === 23 && minutes > 59)) {
    throw new AppError('VALIDATION_ERROR', 'End time cannot exceed 23:59 (no overnight shifts allowed)', 400);
  }
}

/**
 * Calculate duration in minutes between two Date objects (TIME columns)
 * Used for calculating attendance duration from stored times
 */
export function calculateDurationFromDates(startTime: Date | null, endTime: Date | null): number {
  if (!startTime || !endTime) return 0;
  
  const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
  const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
  return endMinutes - startMinutes;
}
