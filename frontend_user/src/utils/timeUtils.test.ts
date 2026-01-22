/**
 * Unit tests for timeUtils.ts
 * Tests all time formatting and manipulation functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDurationInput,
  parseDurationInput,
  formatTimeForPicker,
  parseTimeFromPicker,
  addMinutesToTime,
  getCurrentTime,
  roundTimeToInterval,
  compareTimes,
  isTimeInRange,
} from './timeUtils';

// ============================================================================
// Duration Input Formatting Tests
// ============================================================================

describe('formatDurationInput', () => {
  it('should format minutes to hh:mm format', () => {
    expect(formatDurationInput(510)).toBe('08:30');
    expect(formatDurationInput(45)).toBe('00:45');
    expect(formatDurationInput(0)).toBe('00:00');
    expect(formatDurationInput(60)).toBe('01:00');
    expect(formatDurationInput(1439)).toBe('23:59');
  });

  it('should handle large values', () => {
    expect(formatDurationInput(1500)).toBe('25:00'); // Over 24 hours
  });

  it('should handle negative values', () => {
    expect(formatDurationInput(-30)).toBe('00:00');
  });

  it('should pad with leading zeros', () => {
    expect(formatDurationInput(5)).toBe('00:05');
    expect(formatDurationInput(65)).toBe('01:05');
  });
});

describe('parseDurationInput', () => {
  it('should parse valid hh:mm format to minutes', () => {
    expect(parseDurationInput('08:30')).toBe(510);
    expect(parseDurationInput('00:45')).toBe(45);
    expect(parseDurationInput('23:59')).toBe(1439);
    expect(parseDurationInput('00:00')).toBe(0);
  });

  it('should parse flexible h:mm format', () => {
    expect(parseDurationInput('8:30')).toBe(510);
    expect(parseDurationInput('0:45')).toBe(45);
    expect(parseDurationInput('9:00')).toBe(540);
  });

  it('should handle whitespace', () => {
    expect(parseDurationInput(' 08:30 ')).toBe(510);
    expect(parseDurationInput('  9:00  ')).toBe(540);
  });

  it('should return null for invalid format', () => {
    expect(parseDurationInput('invalid')).toBeNull();
    expect(parseDurationInput('8')).toBeNull();
    expect(parseDurationInput('8:5')).toBeNull();
    expect(parseDurationInput('08:5')).toBeNull();
    expect(parseDurationInput('abc:de')).toBeNull();
  });

  it('should return null for out of range values', () => {
    expect(parseDurationInput('24:00')).toBeNull();
    expect(parseDurationInput('23:60')).toBeNull();
    expect(parseDurationInput('-1:00')).toBeNull();
    expect(parseDurationInput('12:-1')).toBeNull();
  });

  it('should return null for empty or null input', () => {
    expect(parseDurationInput('')).toBeNull();
    expect(parseDurationInput(null as any)).toBeNull();
    expect(parseDurationInput(undefined as any)).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(parseDurationInput(123 as any)).toBeNull();
  });
});

// ============================================================================
// Time Picker Formatting Tests
// ============================================================================

describe('formatTimeForPicker', () => {
  it('should format valid time to HH:mm', () => {
    expect(formatTimeForPicker('9:00')).toBe('09:00');
    expect(formatTimeForPicker('09:00')).toBe('09:00');
    expect(formatTimeForPicker('23:59')).toBe('23:59');
  });

  it('should handle whitespace', () => {
    expect(formatTimeForPicker(' 9:00 ')).toBe('09:00');
    expect(formatTimeForPicker('  12:30  ')).toBe('12:30');
  });

  it('should return empty string for invalid format', () => {
    expect(formatTimeForPicker('invalid')).toBe('');
    expect(formatTimeForPicker('24:00')).toBe('');
    expect(formatTimeForPicker('12:60')).toBe('');
    expect(formatTimeForPicker('9')).toBe('');
  });

  it('should return empty string for null/undefined', () => {
    expect(formatTimeForPicker(null)).toBe('');
    expect(formatTimeForPicker(undefined)).toBe('');
  });

  it('should return empty string for non-string input', () => {
    expect(formatTimeForPicker(123 as any)).toBe('');
  });
});

describe('parseTimeFromPicker', () => {
  it('should parse valid HH:mm time', () => {
    expect(parseTimeFromPicker('09:00')).toBe('09:00');
    expect(parseTimeFromPicker('23:59')).toBe('23:59');
    expect(parseTimeFromPicker('00:00')).toBe('00:00');
  });

  it('should handle whitespace', () => {
    expect(parseTimeFromPicker(' 09:00 ')).toBe('09:00');
  });

  it('should return null for invalid format', () => {
    expect(parseTimeFromPicker('9:00')).toBeNull(); // Should be HH:mm
    expect(parseTimeFromPicker('24:00')).toBeNull();
    expect(parseTimeFromPicker('12:60')).toBeNull();
    expect(parseTimeFromPicker('invalid')).toBeNull();
  });

  it('should return null for null/undefined', () => {
    expect(parseTimeFromPicker(null)).toBeNull();
    expect(parseTimeFromPicker(undefined)).toBeNull();
  });

  it('should return null for non-string input', () => {
    expect(parseTimeFromPicker(123 as any)).toBeNull();
  });
});

// ============================================================================
// Time Manipulation Tests
// ============================================================================

describe('addMinutesToTime', () => {
  it('should add minutes to time', () => {
    expect(addMinutesToTime('09:00', 30)).toBe('09:30');
    expect(addMinutesToTime('09:00', 60)).toBe('10:00');
    expect(addMinutesToTime('23:00', 30)).toBe('23:30');
  });

  it('should subtract minutes from time', () => {
    expect(addMinutesToTime('09:00', -15)).toBe('08:45');
    expect(addMinutesToTime('09:00', -60)).toBe('08:00');
  });

  it('should wrap to next day on overflow', () => {
    expect(addMinutesToTime('23:30', 45)).toBe('00:15');
    expect(addMinutesToTime('23:59', 1)).toBe('00:00');
  });

  it('should wrap to previous day on negative overflow', () => {
    expect(addMinutesToTime('00:15', -30)).toBe('23:45');
    expect(addMinutesToTime('00:00', -1)).toBe('23:59');
  });

  it('should return null for invalid time', () => {
    expect(addMinutesToTime('invalid', 30)).toBeNull();
    expect(addMinutesToTime('25:00', 30)).toBeNull();
  });
});

describe('getCurrentTime', () => {
  beforeEach(() => {
    // Mock Date to return a fixed time
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return current time in HH:mm format', () => {
    // Set fixed date: 2026-01-21 14:30:45
    vi.setSystemTime(new Date('2026-01-21T14:30:45'));
    expect(getCurrentTime()).toBe('14:30');
  });

  it('should pad with leading zeros', () => {
    // Set fixed date: 2026-01-21 09:05:00
    vi.setSystemTime(new Date('2026-01-21T09:05:00'));
    expect(getCurrentTime()).toBe('09:05');
  });
});

describe('roundTimeToInterval', () => {
  it('should round to nearest 15-minute interval', () => {
    expect(roundTimeToInterval('09:07', 15)).toBe('09:00');
    expect(roundTimeToInterval('09:08', 15)).toBe('09:15');
    expect(roundTimeToInterval('09:22', 15)).toBe('09:15');
    expect(roundTimeToInterval('09:23', 15)).toBe('09:30');
  });

  it('should round to nearest 30-minute interval', () => {
    expect(roundTimeToInterval('09:14', 30)).toBe('09:00');
    expect(roundTimeToInterval('09:15', 30)).toBe('09:30');
    expect(roundTimeToInterval('09:44', 30)).toBe('09:30');
    expect(roundTimeToInterval('09:45', 30)).toBe('10:00');
  });

  it('should handle 24:00 case (wraps to 00:00)', () => {
    expect(roundTimeToInterval('23:53', 15)).toBe('00:00');
  });

  it('should return null for invalid time', () => {
    expect(roundTimeToInterval('invalid', 15)).toBeNull();
  });

  it('should return null for invalid interval', () => {
    expect(roundTimeToInterval('09:00', 0)).toBeNull();
    expect(roundTimeToInterval('09:00', -15)).toBeNull();
  });
});

// ============================================================================
// Time Comparison Tests
// ============================================================================

describe('compareTimes', () => {
  it('should return -1 when time1 < time2', () => {
    expect(compareTimes('09:00', '10:00')).toBe(-1);
    expect(compareTimes('09:00', '09:30')).toBe(-1);
    expect(compareTimes('00:00', '23:59')).toBe(-1);
  });

  it('should return 1 when time1 > time2', () => {
    expect(compareTimes('10:00', '09:00')).toBe(1);
    expect(compareTimes('09:30', '09:00')).toBe(1);
    expect(compareTimes('23:59', '00:00')).toBe(1);
  });

  it('should return 0 when times are equal', () => {
    expect(compareTimes('09:00', '09:00')).toBe(0);
    expect(compareTimes('12:30', '12:30')).toBe(0);
    expect(compareTimes('00:00', '00:00')).toBe(0);
  });

  it('should return null for invalid times', () => {
    expect(compareTimes('invalid', '09:00')).toBeNull();
    expect(compareTimes('09:00', 'invalid')).toBeNull();
    expect(compareTimes('25:00', '09:00')).toBeNull();
  });
});

describe('isTimeInRange', () => {
  it('should return true when time is within range', () => {
    expect(isTimeInRange('10:00', '09:00', '17:00')).toBe(true);
    expect(isTimeInRange('12:30', '09:00', '17:00')).toBe(true);
    expect(isTimeInRange('16:59', '09:00', '17:00')).toBe(true);
  });

  it('should return true when time equals start or end', () => {
    expect(isTimeInRange('09:00', '09:00', '17:00')).toBe(true);
    expect(isTimeInRange('17:00', '09:00', '17:00')).toBe(true);
  });

  it('should return false when time is before range', () => {
    expect(isTimeInRange('08:00', '09:00', '17:00')).toBe(false);
    expect(isTimeInRange('08:59', '09:00', '17:00')).toBe(false);
  });

  it('should return false when time is after range', () => {
    expect(isTimeInRange('18:00', '09:00', '17:00')).toBe(false);
    expect(isTimeInRange('17:01', '09:00', '17:00')).toBe(false);
  });

  it('should return false for invalid times', () => {
    expect(isTimeInRange('invalid', '09:00', '17:00')).toBe(false);
    expect(isTimeInRange('10:00', 'invalid', '17:00')).toBe(false);
    expect(isTimeInRange('10:00', '09:00', 'invalid')).toBe(false);
  });
});
