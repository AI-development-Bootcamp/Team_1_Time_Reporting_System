import { describe, it, expect } from 'vitest';
import {
  calculateDurationMinutes,
  calculateDurationFromDates,
  validateTimeRange,
  validateNoMidnightCrossing,
  timeRangesOverlap,
} from '../utils/TimeValidation';

// ============================================================================
// Unit Tests: AttendanceService - Time Validation Logic
// These test the pure functions used by AttendanceService for validation
// ============================================================================

describe('AttendanceService - Time Validation Logic', () => {
  // ==========================================================================
  // Duration Calculation (used for attendance duration)
  // ==========================================================================

  describe('calculateDurationMinutes', () => {
    it('should calculate standard work day (8 hours)', () => {
      expect(calculateDurationMinutes('09:00', '17:00')).toBe(480);
    });

    it('should calculate half day (4 hours)', () => {
      expect(calculateDurationMinutes('09:00', '13:00')).toBe(240);
    });

    it('should calculate with minutes precision', () => {
      expect(calculateDurationMinutes('09:30', '14:45')).toBe(315); // 5h 15m
    });

    it('should handle early morning shifts', () => {
      expect(calculateDurationMinutes('06:00', '14:00')).toBe(480);
    });

    it('should handle late shifts', () => {
      expect(calculateDurationMinutes('14:00', '22:00')).toBe(480);
    });
  });

  describe('calculateDurationFromDates', () => {
    it('should calculate duration from Date objects', () => {
      const start = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
      const end = new Date(Date.UTC(1970, 0, 1, 17, 0, 0));
      expect(calculateDurationFromDates(start, end)).toBe(480);
    });

    it('should return 0 for null start', () => {
      const end = new Date(Date.UTC(1970, 0, 1, 17, 0, 0));
      expect(calculateDurationFromDates(null, end)).toBe(0);
    });

    it('should return 0 for null end', () => {
      const start = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
      expect(calculateDurationFromDates(start, null)).toBe(0);
    });

    it('should return 0 for both null', () => {
      expect(calculateDurationFromDates(null, null)).toBe(0);
    });
  });

  // ==========================================================================
  // Time Range Validation (endTime > startTime)
  // ==========================================================================

  describe('validateTimeRange', () => {
    it('should accept valid time ranges', () => {
      expect(() => validateTimeRange('09:00', '17:00')).not.toThrow();
      expect(() => validateTimeRange('00:00', '23:59')).not.toThrow();
      expect(() => validateTimeRange('08:30', '08:31')).not.toThrow(); // 1 minute
    });

    it('should reject equal start and end times', () => {
      expect(() => validateTimeRange('09:00', '09:00')).toThrow('End time must be after start time');
    });

    it('should reject end time before start time', () => {
      expect(() => validateTimeRange('17:00', '09:00')).toThrow('End time must be after start time');
      expect(() => validateTimeRange('14:30', '14:29')).toThrow('End time must be after start time');
    });
  });

  // ==========================================================================
  // Midnight Crossing Validation (endTime <= 23:59)
  // ==========================================================================

  describe('validateNoMidnightCrossing', () => {
    it('should accept valid end times within the day', () => {
      expect(() => validateNoMidnightCrossing('00:00')).not.toThrow();
      expect(() => validateNoMidnightCrossing('12:00')).not.toThrow();
      expect(() => validateNoMidnightCrossing('23:59')).not.toThrow();
    });

    it('should reject invalid time formats (24:00 and beyond)', () => {
      expect(() => validateNoMidnightCrossing('24:00')).toThrow('Invalid time format');
      expect(() => validateNoMidnightCrossing('25:00')).toThrow('Invalid time format');
    });
  });

  // ==========================================================================
  // Overlap Detection (for checking attendance conflicts)
  // ==========================================================================

  describe('timeRangesOverlap', () => {
    describe('non-overlapping attendance scenarios', () => {
      it('should detect non-overlapping morning and afternoon shifts', () => {
        // Morning: 09:00-12:00, Afternoon: 14:00-18:00
        expect(timeRangesOverlap('09:00', '12:00', '14:00', '18:00')).toBe(false);
      });

      it('should detect adjacent shifts as non-overlapping', () => {
        // Shift 1 ends at 12:00, Shift 2 starts at 12:00
        expect(timeRangesOverlap('09:00', '12:00', '12:00', '17:00')).toBe(false);
      });

      it('should detect split shifts as non-overlapping', () => {
        // Morning shift + evening shift with gap
        expect(timeRangesOverlap('06:00', '10:00', '18:00', '22:00')).toBe(false);
      });
    });

    describe('overlapping attendance scenarios', () => {
      it('should detect partial overlap (start overlaps)', () => {
        // Shift 1: 09:00-14:00, Shift 2: 12:00-18:00
        expect(timeRangesOverlap('09:00', '14:00', '12:00', '18:00')).toBe(true);
      });

      it('should detect one shift containing another', () => {
        // Full day contains half day
        expect(timeRangesOverlap('08:00', '20:00', '10:00', '14:00')).toBe(true);
      });

      it('should detect identical shifts', () => {
        expect(timeRangesOverlap('09:00', '17:00', '09:00', '17:00')).toBe(true);
      });

      it('should detect 1 minute overlap', () => {
        // Shift 1: 09:00-12:01, Shift 2: 12:00-17:00
        expect(timeRangesOverlap('09:00', '12:01', '12:00', '17:00')).toBe(true);
      });
    });
  });
});
