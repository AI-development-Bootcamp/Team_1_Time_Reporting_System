/**
 * Date utilities using Day.js
 * Provides Hebrew date formatting and date manipulation helpers
 */

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Enable UTC plugin
dayjs.extend(utc);

// ============================================================================
// Hebrew Day Names (Sunday = 0, Saturday = 6)
// ============================================================================

const HEBREW_DAY_NAMES: Record<number, string> = {
  0: "יום א'",
  1: "יום ב'",
  2: "יום ג'",
  3: "יום ד'",
  4: "יום ה'",
  5: "יום ו'",
  6: "יום ש'",
};

// Short version for badges
const HEBREW_DAY_NAMES_SHORT: Record<number, string> = {
  0: "א'",
  1: "ב'",
  2: "ג'",
  3: "ד'",
  4: "ה'",
  5: "ו'",
  6: "ש'",
};

// ============================================================================
// Hebrew Month Names (0-indexed: January = 0)
// ============================================================================

const HEBREW_MONTH_NAMES: Record<number, string> = {
  0: 'ינואר',
  1: 'פברואר',
  2: 'מרץ',
  3: 'אפריל',
  4: 'מאי',
  5: 'יוני',
  6: 'יולי',
  7: 'אוגוסט',
  8: 'ספטמבר',
  9: 'אוקטובר',
  10: 'נובמבר',
  11: 'דצמבר',
};

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format date as DD/MM/YY, יום X'
 * Example: "25/10/15, יום ד'"
 */
export function formatDateWithDay(date: string | Date | Dayjs): string {
  const d = dayjs(date);
  const formatted = d.format('DD/MM/YY');
  const dayName = HEBREW_DAY_NAMES[d.day()];
  return `${formatted}, ${dayName}`;
}

/**
 * Format date as DD/MM/YY
 */
export function formatDate(date: string | Date | Dayjs): string {
  return dayjs(date).format('DD/MM/YY');
}

/**
 * Get Hebrew day name
 */
export function getHebrewDayName(date: string | Date | Dayjs): string {
  return HEBREW_DAY_NAMES[dayjs(date).day()];
}

/**
 * Get short Hebrew day name
 */
export function getHebrewDayNameShort(date: string | Date | Dayjs): string {
  return HEBREW_DAY_NAMES_SHORT[dayjs(date).day()];
}

/**
 * Get Hebrew month name (1-indexed month)
 */
export function getHebrewMonthName(month: number): string {
  return HEBREW_MONTH_NAMES[month - 1] || '';
}

/**
 * Get Hebrew month name from date
 */
export function getHebrewMonthNameFromDate(date: string | Date | Dayjs): string {
  return HEBREW_MONTH_NAMES[dayjs(date).month()];
}

// ============================================================================
// Weekend / Workday Detection
// ============================================================================

/**
 * Check if date is weekend (Friday or Saturday in Israel)
 */
export function isWeekend(date: string | Date | Dayjs): boolean {
  const day = dayjs(date).day();
  return day === 5 || day === 6; // Friday = 5, Saturday = 6
}

/**
 * Check if date is a workday (Sunday-Thursday)
 */
export function isWorkday(date: string | Date | Dayjs): boolean {
  const day = dayjs(date).day();
  return day >= 0 && day <= 4; // Sunday = 0, Thursday = 4
}

/**
 * Check if date is Friday
 */
export function isFriday(date: string | Date | Dayjs): boolean {
  return dayjs(date).day() === 5;
}

/**
 * Check if date is Saturday
 */
export function isSaturday(date: string | Date | Dayjs): boolean {
  return dayjs(date).day() === 6;
}

// ============================================================================
// Duration Calculation
// ============================================================================

/**
 * Calculate duration in minutes from HH:mm times
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

/**
 * Format duration in minutes to "X ש'" format
 * Example: 540 minutes → "9 ש'"
 */
export function formatDurationHours(minutes: number): string {
  const hours = minutes / 60;
  // Show one decimal place if not a whole number
  const formatted = hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
  return `${formatted} ש'`;
}

/**
 * Format time range as "HH:mm-HH:mm"
 */
export function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return '';
  return `${startTime}-${endTime}`;
}

// ============================================================================
// Date Range Generation
// ============================================================================

/**
 * Generate array of dates for a month
 * @param month 1-12
 * @param year Full year (e.g., 2026)
 * @param upToToday If true, only return dates up to today (for current month)
 * @returns Array of date strings in YYYY-MM-DD format, sorted descending (latest first)
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
 * Check if a month is in the future
 */
export function isFutureMonth(month: number, year: number): boolean {
  const today = dayjs();
  const targetMonth = dayjs().year(year).month(month - 1);
  return targetMonth.isAfter(today, 'month');
}

/**
 * Check if a month is the current month
 */
export function isCurrentMonth(month: number, year: number): boolean {
  const today = dayjs();
  return today.month() === month - 1 && today.year() === year;
}

/**
 * Get current month (1-12)
 */
export function getCurrentMonth(): number {
  return dayjs().month() + 1;
}

/**
 * Get current year
 */
export function getCurrentYear(): number {
  return dayjs().year();
}

/**
 * Parse date string to Dayjs object
 */
export function parseDate(date: string): Dayjs {
  return dayjs(date);
}

// ============================================================================
// Exports
// ============================================================================

export { dayjs };
export { HEBREW_DAY_NAMES, HEBREW_DAY_NAMES_SHORT, HEBREW_MONTH_NAMES };
