/**
 * Time formatting utilities for user input and display
 * Focused on time picker integration and user-friendly formatting
 */

// ============================================================================
// Duration Input Formatting
// ============================================================================

/**
 * Format duration in minutes to hh:mm display for user input
 * @param minutes Duration in minutes
 * @returns Formatted string in hh:mm format (e.g., "08:30", "00:45")
 * 
 * @example
 * formatDurationInput(510) // "08:30"
 * formatDurationInput(45)  // "00:45"
 * formatDurationInput(0)   // "00:00"
 */
export function formatDurationInput(minutes: number): string {
  if (minutes < 0) {
    return '00:00';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  // Format with leading zeros (2 digits)
  const hoursStr = hours.toString().padStart(2, '0');
  const minsStr = mins.toString().padStart(2, '0');

  return `${hoursStr}:${minsStr}`;
}

/**
 * Parse duration input (hh:mm or h:mm) to minutes
 * Supports flexible input formats: "08:30", "8:30", "0:45"
 * 
 * @param input Duration string in hh:mm or h:mm format
 * @returns Duration in minutes, or null if invalid
 * 
 * @example
 * parseDurationInput("08:30") // 510
 * parseDurationInput("8:30")  // 510
 * parseDurationInput("0:45")  // 45
 * parseDurationInput("23:59") // 1439
 * parseDurationInput("invalid") // null
 */
export function parseDurationInput(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = input.trim();

  // Check basic format: one or two digits, colon, two digits
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = trimmed.match(timeRegex);

  if (!match) {
    return null;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // Validate ranges
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

// ============================================================================
// Time Picker Formatting
// ============================================================================

/**
 * Format time for time picker component (ensures HH:mm format)
 * Accepts flexible input and normalizes to HH:mm
 * 
 * @param time Time string (may be in various formats)
 * @returns Formatted time in HH:mm format, or empty string if invalid
 * 
 * @example
 * formatTimeForPicker("9:00")   // "09:00"
 * formatTimeForPicker("09:00")  // "09:00"
 * formatTimeForPicker("23:59")  // "23:59"
 * formatTimeForPicker("invalid") // ""
 */
export function formatTimeForPicker(time: string | null | undefined): string {
  if (!time || typeof time !== 'string') {
    return '';
  }

  // Trim whitespace
  const trimmed = time.trim();

  // Check if already in HH:mm format
  const strictRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
  if (strictRegex.test(trimmed)) {
    return trimmed;
  }

  // Try to parse flexible format (H:mm or HH:mm)
  const flexibleRegex = /^(\d{1,2}):(\d{2})$/;
  const match = trimmed.match(flexibleRegex);

  if (!match) {
    return '';
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // Validate ranges
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return '';
  }

  // Format with leading zeros
  const hoursStr = hours.toString().padStart(2, '0');
  const minsStr = minutes.toString().padStart(2, '0');

  return `${hoursStr}:${minsStr}`;
}

/**
 * Parse time from time picker component
 * Validates and extracts time value from picker
 * 
 * @param time Time value from picker (should be HH:mm)
 * @returns Validated time in HH:mm format, or null if invalid
 * 
 * @example
 * parseTimeFromPicker("09:00") // "09:00"
 * parseTimeFromPicker("23:59") // "23:59"
 * parseTimeFromPicker("25:00") // null
 * parseTimeFromPicker("invalid") // null
 */
export function parseTimeFromPicker(time: string | null | undefined): string | null {
  if (!time || typeof time !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = time.trim();

  // Validate HH:mm format
  const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

// ============================================================================
// Time Manipulation
// ============================================================================

/**
 * Add minutes to a time string
 * @param time Time in HH:mm format
 * @param minutesToAdd Number of minutes to add (can be negative)
 * @returns New time in HH:mm format, or null if invalid
 * 
 * @example
 * addMinutesToTime("09:00", 30)   // "09:30"
 * addMinutesToTime("09:00", -15)  // "08:45"
 * addMinutesToTime("23:30", 45)   // "00:15" (wraps to next day)
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string | null {
  const parsed = parseTimeFromPicker(time);
  if (!parsed) {
    return null;
  }

  const [hours, minutes] = parsed.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes + minutesToAdd;

  // Handle negative values (wrap to previous day)
  while (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  // Handle overflow (wrap to next day)
  totalMinutes = totalMinutes % (24 * 60);

  return formatDurationInput(totalMinutes);
}

/**
 * Get current time in HH:mm format
 * @returns Current time as HH:mm string
 * 
 * @example
 * getCurrentTime() // "14:30" (depends on current time)
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Round time to nearest interval
 * @param time Time in HH:mm format
 * @param intervalMinutes Interval to round to (e.g., 15 for quarter hours)
 * @returns Rounded time in HH:mm format, or null if invalid
 * 
 * @example
 * roundTimeToInterval("09:07", 15) // "09:00"
 * roundTimeToInterval("09:08", 15) // "09:15"
 * roundTimeToInterval("09:23", 30) // "09:30"
 */
export function roundTimeToInterval(time: string, intervalMinutes: number): string | null {
  const parsed = parseTimeFromPicker(time);
  if (!parsed || intervalMinutes <= 0) {
    return null;
  }

  const [hours, minutes] = parsed.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;

  // Round to nearest interval
  const rounded = Math.round(totalMinutes / intervalMinutes) * intervalMinutes;

  // Handle 24:00 case (should be 00:00)
  const finalMinutes = rounded >= 24 * 60 ? 0 : rounded;

  return formatDurationInput(finalMinutes);
}

// ============================================================================
// Time Comparison
// ============================================================================

/**
 * Compare two times
 * @param time1 First time in HH:mm format
 * @param time2 Second time in HH:mm format
 * @returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2, null if invalid
 * 
 * @example
 * compareTimes("09:00", "10:00") // -1
 * compareTimes("10:00", "09:00") // 1
 * compareTimes("09:00", "09:00") // 0
 */
export function compareTimes(time1: string, time2: string): number | null {
  const parsed1 = parseTimeFromPicker(time1);
  const parsed2 = parseTimeFromPicker(time2);

  if (!parsed1 || !parsed2) {
    return null;
  }

  const [h1, m1] = parsed1.split(':').map(Number);
  const [h2, m2] = parsed2.split(':').map(Number);

  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;

  if (minutes1 < minutes2) return -1;
  if (minutes1 > minutes2) return 1;
  return 0;
}

/**
 * Check if time is within a range (inclusive)
 * @param time Time to check in HH:mm format
 * @param startTime Range start in HH:mm format
 * @param endTime Range end in HH:mm format
 * @returns true if time is within range, false otherwise
 * 
 * @example
 * isTimeInRange("10:00", "09:00", "17:00") // true
 * isTimeInRange("08:00", "09:00", "17:00") // false
 * isTimeInRange("18:00", "09:00", "17:00") // false
 */
export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const compareStart = compareTimes(time, startTime);
  const compareEnd = compareTimes(time, endTime);

  if (compareStart === null || compareEnd === null) {
    return false;
  }

  return compareStart >= 0 && compareEnd <= 0;
}
