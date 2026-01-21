/**
 * Date utilities using Day.js
 * Provides Hebrew date formatting and date manipulation helpers
 */

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  HEBREW_DAY_NAMES,
  HEBREW_DAY_NAMES_SHORT,
  HEBREW_MONTH_NAMES,
} from './constants';

// Enable UTC plugin
dayjs.extend(utc);

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format a date as "DD/MM/YY, <Hebrew day name>".
 *
 * @param date - The date to format; accepted types: string, Date, or Dayjs
 * @returns The formatted date string, for example: "20/01/26, יום ג'"
 */
export function formatDateWithDay(date: string | Date | Dayjs): string {
  const d = dayjs(date);
  const formatted = d.format('DD/MM/YY');
  const dayName = HEBREW_DAY_NAMES[d.day()];
  // Simple string: date, comma, space, dayName
  return `${formatted}, ${dayName}`;
}

/**
 * Formats a date as DD/MM/YY.
 *
 * @param date - The input date (string, Date, or Dayjs)
 * @returns The formatted date string in `DD/MM/YY` format
 */
export function formatDate(date: string | Date | Dayjs): string {
  return dayjs(date).format('DD/MM/YY');
}

/**
 * Get the full Hebrew weekday name for the specified date.
 *
 * @returns The Hebrew weekday name corresponding to the provided `date`.
 */
export function getHebrewDayName(date: string | Date | Dayjs): string {
  return HEBREW_DAY_NAMES[dayjs(date).day()];
}

/**
 * Get the short Hebrew name of the weekday for a given date.
 *
 * @param date - The date to evaluate (string, Date, or Dayjs)
 * @returns The short Hebrew weekday name for `date`
 */
export function getHebrewDayNameShort(date: string | Date | Dayjs): string {
  return HEBREW_DAY_NAMES_SHORT[dayjs(date).day()];
}

/**
 * Get the Hebrew name for a month specified as a 1-indexed value.
 *
 * @param month - The month number where January is `1` and December is `12`
 * @returns The Hebrew month name for `month`, or an empty string if `month` is out of range
 */
export function getHebrewMonthName(month: number): string {
  return HEBREW_MONTH_NAMES[month - 1] || '';
}

/**
 * Return the Hebrew month name for the given date.
 *
 * @param date - A date value (string, Date, or Dayjs) from which to derive the month
 * @returns The Hebrew name of the month corresponding to `date`
 */
export function getHebrewMonthNameFromDate(date: string | Date | Dayjs): string {
  return HEBREW_MONTH_NAMES[dayjs(date).month()];
}

// ============================================================================
// Weekend / Workday Detection
// ============================================================================

/**
 * Determines whether the given date falls on Israel's weekend (Friday or Saturday).
 *
 * @returns `true` if the date is Friday or Saturday, `false` otherwise.
 */
export function isWeekend(date: string | Date | Dayjs): boolean {
  const day = dayjs(date).day();
  return day === 5 || day === 6; // Friday = 5, Saturday = 6
}

/**
 * Determines whether the provided date falls on a workday (Sunday through Thursday).
 *
 * @param date - The date to check; may be a string, Date, or Dayjs instance.
 * @returns `true` if the date is Sunday, Monday, Tuesday, Wednesday, or Thursday; `false` otherwise.
 */
export function isWorkday(date: string | Date | Dayjs): boolean {
  const day = dayjs(date).day();
  return day >= 0 && day <= 4; // Sunday = 0, Thursday = 4
}

/**
 * Determines whether the given date falls on a Friday.
 *
 * @returns `true` if the date falls on a Friday, `false` otherwise.
 */
export function isFriday(date: string | Date | Dayjs): boolean {
  return dayjs(date).day() === 5;
}

/**
 * Determines whether the given date falls on Saturday.
 *
 * @returns `true` if the date is Saturday, `false` otherwise.
 */
export function isSaturday(date: string | Date | Dayjs): boolean {
  return dayjs(date).day() === 6;
}

// ============================================================================
// Duration Calculation
// ============================================================================

/**
 * Compute the difference in minutes from `startTime` to `endTime`.
 *
 * @param startTime - Start time in `HH:mm` format
 * @param endTime - End time in `HH:mm` format
 * @returns The number of minutes from `startTime` to `endTime`; may be negative if `endTime` is earlier than `startTime`
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

/**
 * Convert a duration given in minutes into an `HH:MM` string with leading zeros.
 *
 * @param minutes - Total minutes to format
 * @returns The duration formatted as `HH:MM` (e.g., `270` → `04:30`)
 */
export function formatDurationHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  // Format with leading zeros
  const hoursStr = hours.toString().padStart(2, '0');
  const minsStr = mins.toString().padStart(2, '0');
  
  return `${hoursStr}:${minsStr}`;
}

/**
 * Format a start and end time into an HH:mm-HH:mm range.
 *
 * @param startTime - Start time in `HH:mm` format or `null`
 * @param endTime - End time in `HH:mm` format or `null`
 * @returns A string in the form `"HH:mm-HH:mm"` when both `startTime` and `endTime` are provided, otherwise an empty string
 */
export function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return '';
  return `${startTime}-${endTime}`;
}

// ============================================================================
// Date Range Generation
// ============================================================================

/**
 * Generate an array of date strings for the specified month, ordered with the latest date first.
 *
 * @param month - Month as 1-12
 * @param year - Full year (for example, 2026)
 * @param upToToday - If true and the target month/year is the current month, include dates only up to today; ignored for other months
 * @returns An array of date strings in `YYYY-MM-DD` format, sorted descending (latest first). If the target month is in the future, returns an empty array.
 */
export function generateMonthDates(
  month: number,
  year: number,
  upToToday: boolean = false
): string[] {
  const startOfMonth = dayjs().year(year).month(month - 1).date(1).startOf('day');
  const today = dayjs().startOf('day');
  
  let endDate: Dayjs;
  if (upToToday && startOfMonth.month() === today.month() && startOfMonth.year() === today.year()) {
    // Current month - only up to today
    endDate = today;
  } else if (startOfMonth.isAfter(today)) {
    // Future month - return empty array
    return [];
  } else {
    // Past month - full month
    endDate = startOfMonth.endOf('month');
  }
  
  const dates: string[] = [];
  let current = startOfMonth;
  
  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    dates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }
  
  // Sort descending (latest first)
  return dates.reverse();
}

/**
 * Determine whether a given month and year are after the current month.
 *
 * @param month - The target month as 1–12
 * @param year - The target calendar year (e.g., 2026)
 * @returns `true` if the target month/year is after the current month (compared at month granularity), `false` otherwise
 */
export function isFutureMonth(month: number, year: number): boolean {
  const today = dayjs();
  const targetMonth = dayjs().year(year).month(month - 1);
  return targetMonth.isAfter(today, 'month');
}

/**
 * Determines whether the specified month and year correspond to the current calendar month.
 *
 * @param month - The 1-based month number (1 = January, 12 = December).
 * @param year - The full year (e.g., 2026).
 * @returns `true` if the given month and year match the current month and year, `false` otherwise.
 */
export function isCurrentMonth(month: number, year: number): boolean {
  const today = dayjs();
  return today.month() === month - 1 && today.year() === year;
}

/**
 * Get the current calendar month as a number from 1 to 12.
 *
 * @returns The current month (1–12)
 */
export function getCurrentMonth(): number {
  return dayjs().month() + 1;
}

/**
 * Get the current calendar year.
 *
 * @returns The current calendar year as a four-digit number
 */
export function getCurrentYear(): number {
  return dayjs().year();
}

/**
 * Convert a parseable date string into a Dayjs instance.
 *
 * @param date - A date string parseable by Day.js (commonly ISO 8601 or other formats supported by Day.js)
 * @returns A Dayjs object representing the parsed date
 */
export function parseDate(date: string): Dayjs {
  return dayjs(date);
}

// ============================================================================
// Exports
// ============================================================================

export { dayjs };