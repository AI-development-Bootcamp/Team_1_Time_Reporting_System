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

describe('timeUtils', () => {
  // ============================================================================
  // Duration Input Formatting
  // ============================================================================

  describe('formatDurationInput', () => {
    it('formats full hours correctly', () => {
      expect(formatDurationInput(480)).toBe('08:00'); // 8 hours
      expect(formatDurationInput(540)).toBe('09:00'); // 9 hours
      expect(formatDurationInput(60)).toBe('01:00'); // 1 hour
    });

    it('formats partial hours correctly', () => {
      expect(formatDurationInput(510)).toBe('08:30'); // 8.5 hours
      expect(formatDurationInput(90)).toBe('01:30'); // 1.5 hours
      expect(formatDurationInput(45)).toBe('00:45'); // 45 minutes
    });

    it('formats zero minutes', () => {
      expect(formatDurationInput(0)).toBe('00:00');
    });

    it('formats large durations', () => {
      expect(formatDurationInput(1439)).toBe('23:59'); // Max valid time
      expect(formatDurationInput(1440)).toBe('24:00'); // 24 hours
      expect(formatDurationInput(2880)).toBe('48:00'); // 48 hours
    });

    it('handles negative values', () => {
      expect(formatDurationInput(-10)).toBe('00:00');
      expect(formatDurationInput(-100)).toBe('00:00');
    });

    it('formats single digit values with leading zeros', () => {
      expect(formatDurationInput(5)).toBe('00:05');
      expect(formatDurationInput(59)).toBe('00:59');
    });
  });

  describe('parseDurationInput', () => {
    it('parses valid duration with leading zeros', () => {
      expect(parseDurationInput('08:30')).toBe(510);
      expect(parseDurationInput('09:00')).toBe(540);
      expect(parseDurationInput('00:45')).toBe(45);
    });

    it('parses valid duration without leading zeros', () => {
      expect(parseDurationInput('8:30')).toBe(510);
      expect(parseDurationInput('9:00')).toBe(540);
      expect(parseDurationInput('0:45')).toBe(45);
    });

    it('parses edge cases', () => {
      expect(parseDurationInput('00:00')).toBe(0);
      expect(parseDurationInput('23:59')).toBe(1439);
    });

    it('returns null for invalid format', () => {
      expect(parseDurationInput('abc')).toBeNull();
      expect(parseDurationInput('25:00')).toBeNull();
      expect(parseDurationInput('12:60')).toBeNull();
      expect(parseDurationInput('12:6')).toBeNull(); // Minutes need 2 digits
      expect(parseDurationInput('123:45')).toBeNull(); // Too many hour digits
    });

    it('returns null for empty or invalid input', () => {
      expect(parseDurationInput('')).toBeNull();
      expect(parseDurationInput('   ')).toBeNull();
    });

    it('handles whitespace', () => {
      expect(parseDurationInput(' 08:30 ')).toBe(510);
      expect(parseDurationInput('  9:00  ')).toBe(540);
    });

    it('returns null for negative values', () => {
      expect(parseDurationInput('-1:00')).toBeNull();
      expect(parseDurationInput('-08:30')).toBeNull();
    });
  });

  // ============================================================================
  // Time Picker Formatting
  // ============================================================================

  describe('formatTimeForPicker', () => {
    it('preserves valid HH:mm format', () => {
      expect(formatTimeForPicker('09:00')).toBe('09:00');
      expect(formatTimeForPicker('23:59')).toBe('23:59');
      expect(formatTimeForPicker('00:00')).toBe('00:00');
    });

    it('formats H:mm to HH:mm', () => {
      expect(formatTimeForPicker('9:00')).toBe('09:00');
      expect(formatTimeForPicker('8:30')).toBe('08:30');
      expect(formatTimeForPicker('0:45')).toBe('00:45');
    });

    it('returns empty string for invalid format', () => {
      expect(formatTimeForPicker('25:00')).toBe('');
      expect(formatTimeForPicker('12:60')).toBe('');
      expect(formatTimeForPicker('abc')).toBe('');
      expect(formatTimeForPicker('12:6')).toBe(''); // Minutes need 2 digits
    });

    it('returns empty string for null/undefined', () => {
      expect(formatTimeForPicker(null)).toBe('');
      expect(formatTimeForPicker(undefined)).toBe('');
      expect(formatTimeForPicker('')).toBe('');
    });

    it('handles whitespace', () => {
      expect(formatTimeForPicker(' 09:00 ')).toBe('09:00');
      expect(formatTimeForPicker('  8:30  ')).toBe('08:30');
    });

    it('validates hour and minute ranges', () => {
      expect(formatTimeForPicker('24:00')).toBe('');
      expect(formatTimeForPicker('23:60')).toBe('');
      expect(formatTimeForPicker('-1:00')).toBe('');
    });
  });

  describe('parseTimeFromPicker', () => {
    it('returns valid HH:mm time', () => {
      expect(parseTimeFromPicker('09:00')).toBe('09:00');
      expect(parseTimeFromPicker('23:59')).toBe('23:59');
      expect(parseTimeFromPicker('00:00')).toBe('00:00');
    });

    it('returns null for invalid format', () => {
      expect(parseTimeFromPicker('9:00')).toBeNull(); // Needs HH format
      expect(parseTimeFromPicker('25:00')).toBeNull();
      expect(parseTimeFromPicker('12:60')).toBeNull();
      expect(parseTimeFromPicker('abc')).toBeNull();
    });

    it('returns null for null/undefined/empty', () => {
      expect(parseTimeFromPicker(null)).toBeNull();
      expect(parseTimeFromPicker(undefined)).toBeNull();
      expect(parseTimeFromPicker('')).toBeNull();
    });

    it('handles whitespace', () => {
      expect(parseTimeFromPicker(' 09:00 ')).toBe('09:00');
      expect(parseTimeFromPicker('  23:59  ')).toBe('23:59');
    });

    it('validates strict HH:mm format', () => {
      expect(parseTimeFromPicker('9:00')).toBeNull(); // Must be 09:00
      expect(parseTimeFromPicker('009:00')).toBeNull(); // Too many digits
    });
  });

  // ============================================================================
  // Time Manipulation
  // ============================================================================

  describe('addMinutesToTime', () => {
    it('adds minutes correctly', () => {
      expect(addMinutesToTime('09:00', 30)).toBe('09:30');
      expect(addMinutesToTime('09:00', 15)).toBe('09:15');
      expect(addMinutesToTime('09:45', 15)).toBe('10:00');
    });

    it('subtracts minutes correctly', () => {
      expect(addMinutesToTime('09:00', -15)).toBe('08:45');
      expect(addMinutesToTime('09:30', -30)).toBe('09:00');
      expect(addMinutesToTime('10:00', -60)).toBe('09:00');
    });

    it('wraps to next day when exceeding 23:59', () => {
      expect(addMinutesToTime('23:30', 45)).toBe('00:15');
      expect(addMinutesToTime('23:59', 1)).toBe('00:00');
      expect(addMinutesToTime('22:00', 180)).toBe('01:00'); // +3 hours
    });

    it('wraps to previous day when going negative', () => {
      expect(addMinutesToTime('00:15', -30)).toBe('23:45');
      expect(addMinutesToTime('00:00', -1)).toBe('23:59');
      expect(addMinutesToTime('01:00', -120)).toBe('23:00'); // -2 hours
    });

    it('returns null for invalid time', () => {
      expect(addMinutesToTime('invalid', 30)).toBeNull();
      expect(addMinutesToTime('25:00', 30)).toBeNull();
      expect(addMinutesToTime('9:00', 30)).toBeNull(); // Needs HH format
    });

    it('handles zero minutes added', () => {
      expect(addMinutesToTime('09:00', 0)).toBe('09:00');
      expect(addMinutesToTime('23:59', 0)).toBe('23:59');
    });
  });

  describe('getCurrentTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns current time in HH:mm format', () => {
      vi.setSystemTime(new Date('2026-01-21T09:30:00'));
      expect(getCurrentTime()).toBe('09:30');

      vi.setSystemTime(new Date('2026-01-21T14:45:00'));
      expect(getCurrentTime()).toBe('14:45');

      vi.setSystemTime(new Date('2026-01-21T00:00:00'));
      expect(getCurrentTime()).toBe('00:00');
    });

    it('formats single digit hours and minutes with leading zeros', () => {
      vi.setSystemTime(new Date('2026-01-21T09:05:00'));
      expect(getCurrentTime()).toBe('09:05');

      vi.setSystemTime(new Date('2026-01-21T08:07:00'));
      expect(getCurrentTime()).toBe('08:07');
    });
  });

  describe('roundTimeToInterval', () => {
    it('rounds to 15-minute intervals', () => {
      expect(roundTimeToInterval('09:00', 15)).toBe('09:00');
      expect(roundTimeToInterval('09:07', 15)).toBe('09:00');
      expect(roundTimeToInterval('09:08', 15)).toBe('09:15');
      expect(roundTimeToInterval('09:14', 15)).toBe('09:15');
      expect(roundTimeToInterval('09:23', 15)).toBe('09:30');
    });

    it('rounds to 30-minute intervals', () => {
      expect(roundTimeToInterval('09:00', 30)).toBe('09:00');
      expect(roundTimeToInterval('09:14', 30)).toBe('09:00');
      expect(roundTimeToInterval('09:15', 30)).toBe('09:30');
      expect(roundTimeToInterval('09:44', 30)).toBe('09:30');
      expect(roundTimeToInterval('09:45', 30)).toBe('10:00');
    });

    it('rounds to 60-minute intervals', () => {
      expect(roundTimeToInterval('09:00', 60)).toBe('09:00');
      expect(roundTimeToInterval('09:29', 60)).toBe('09:00');
      expect(roundTimeToInterval('09:30', 60)).toBe('10:00');
      expect(roundTimeToInterval('09:59', 60)).toBe('10:00');
    });

    it('handles edge case at 23:59', () => {
      // 23:52 to nearest 15min: 1432 / 15 = 95.47 -> rounds to 95 -> 95*15 = 1425 = 23:45
      expect(roundTimeToInterval('23:52', 15)).toBe('23:45');
      // 23:53+ would round to 96*15 = 1440 = 00:00
      expect(roundTimeToInterval('23:53', 15)).toBe('00:00');
      
      // 23:45 to nearest 30min: 1425 / 30 = 47.5 -> rounds to 48 -> 48*30 = 1440 = 00:00
      expect(roundTimeToInterval('23:45', 30)).toBe('00:00');
    });

    it('returns null for invalid time', () => {
      expect(roundTimeToInterval('invalid', 15)).toBeNull();
      expect(roundTimeToInterval('25:00', 15)).toBeNull();
      expect(roundTimeToInterval('9:00', 15)).toBeNull(); // Needs HH format
    });

    it('returns null for invalid interval', () => {
      expect(roundTimeToInterval('09:00', 0)).toBeNull();
      expect(roundTimeToInterval('09:00', -15)).toBeNull();
    });
  });

  // ============================================================================
  // Time Comparison
  // ============================================================================

  describe('compareTimes', () => {
    it('returns -1 when time1 < time2', () => {
      expect(compareTimes('09:00', '10:00')).toBe(-1);
      expect(compareTimes('08:30', '09:00')).toBe(-1);
      expect(compareTimes('00:00', '23:59')).toBe(-1);
    });

    it('returns 1 when time1 > time2', () => {
      expect(compareTimes('10:00', '09:00')).toBe(1);
      expect(compareTimes('09:00', '08:30')).toBe(1);
      expect(compareTimes('23:59', '00:00')).toBe(1);
    });

    it('returns 0 when times are equal', () => {
      expect(compareTimes('09:00', '09:00')).toBe(0);
      expect(compareTimes('23:59', '23:59')).toBe(0);
      expect(compareTimes('00:00', '00:00')).toBe(0);
    });

    it('returns null for invalid times', () => {
      expect(compareTimes('invalid', '09:00')).toBeNull();
      expect(compareTimes('09:00', 'invalid')).toBeNull();
      expect(compareTimes('25:00', '09:00')).toBeNull();
      expect(compareTimes('9:00', '09:00')).toBeNull(); // Needs HH format
    });

    it('handles edge cases', () => {
      expect(compareTimes('00:00', '00:01')).toBe(-1);
      expect(compareTimes('23:59', '23:58')).toBe(1);
    });
  });

  describe('isTimeInRange', () => {
    it('returns true when time is within range', () => {
      expect(isTimeInRange('10:00', '09:00', '17:00')).toBe(true);
      expect(isTimeInRange('12:30', '09:00', '17:00')).toBe(true);
      expect(isTimeInRange('16:59', '09:00', '17:00')).toBe(true);
    });

    it('returns true when time equals start or end', () => {
      expect(isTimeInRange('09:00', '09:00', '17:00')).toBe(true);
      expect(isTimeInRange('17:00', '09:00', '17:00')).toBe(true);
    });

    it('returns false when time is outside range', () => {
      expect(isTimeInRange('08:00', '09:00', '17:00')).toBe(false);
      expect(isTimeInRange('18:00', '09:00', '17:00')).toBe(false);
      expect(isTimeInRange('08:59', '09:00', '17:00')).toBe(false);
      expect(isTimeInRange('17:01', '09:00', '17:00')).toBe(false);
    });

    it('returns false for invalid times', () => {
      expect(isTimeInRange('invalid', '09:00', '17:00')).toBe(false);
      expect(isTimeInRange('10:00', 'invalid', '17:00')).toBe(false);
      expect(isTimeInRange('10:00', '09:00', 'invalid')).toBe(false);
      expect(isTimeInRange('25:00', '09:00', '17:00')).toBe(false);
    });

    it('handles edge cases with midnight', () => {
      expect(isTimeInRange('00:00', '00:00', '23:59')).toBe(true);
      expect(isTimeInRange('23:59', '00:00', '23:59')).toBe(true);
      expect(isTimeInRange('12:00', '00:00', '23:59')).toBe(true);
    });

    it('handles narrow ranges', () => {
      expect(isTimeInRange('09:30', '09:00', '10:00')).toBe(true);
      expect(isTimeInRange('09:00', '09:00', '09:00')).toBe(true); // Single point
      expect(isTimeInRange('08:59', '09:00', '09:00')).toBe(false);
    });
  });
});
