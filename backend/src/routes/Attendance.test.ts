import { describe, it, expect } from 'vitest';
import {
  calculateDurationMinutes,
  timeStringToDate,
  dateToTimeString,
  timeRangesOverlap,
} from '../utils/TimeValidation';

// ============================================================================
// Unit Tests: Time Helpers
// ============================================================================

describe('timeStringToDate', () => {
  it('should convert valid HH:mm string to UTC Date', () => {
    const result = timeStringToDate('09:30');
    expect(result.getUTCHours()).toBe(9);
    expect(result.getUTCMinutes()).toBe(30);
    expect(result.getUTCFullYear()).toBe(1970);
    expect(result.getUTCMonth()).toBe(0);
    expect(result.getUTCDate()).toBe(1);
  });

  it('should handle midnight (00:00)', () => {
    const result = timeStringToDate('00:00');
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
  });

  it('should handle end of day (23:59)', () => {
    const result = timeStringToDate('23:59');
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
  });

  it('should throw AppError for invalid time format (no colon)', () => {
    expect(() => timeStringToDate('0930')).toThrow('Invalid time format');
  });

  it('should throw AppError for invalid time format (single digit hour)', () => {
    expect(() => timeStringToDate('9:30')).toThrow('Invalid time format');
  });

  it('should throw AppError for invalid hour (25:00)', () => {
    expect(() => timeStringToDate('25:00')).toThrow('Invalid time format');
  });

  it('should throw AppError for invalid minutes (09:60)', () => {
    expect(() => timeStringToDate('09:60')).toThrow('Invalid time format');
  });

  it('should throw AppError for empty string', () => {
    expect(() => timeStringToDate('')).toThrow('Invalid time format');
  });
});

describe('dateToTimeString', () => {
  it('should convert UTC Date to HH:mm string', () => {
    const date = new Date(Date.UTC(1970, 0, 1, 14, 45, 0));
    expect(dateToTimeString(date)).toBe('14:45');
  });

  it('should pad single digit hours', () => {
    const date = new Date(Date.UTC(1970, 0, 1, 9, 30, 0));
    expect(dateToTimeString(date)).toBe('09:30');
  });

  it('should pad single digit minutes', () => {
    const date = new Date(Date.UTC(1970, 0, 1, 12, 5, 0));
    expect(dateToTimeString(date)).toBe('12:05');
  });

  it('should handle midnight', () => {
    const date = new Date(Date.UTC(1970, 0, 1, 0, 0, 0));
    expect(dateToTimeString(date)).toBe('00:00');
  });

  it('should handle 23:59', () => {
    const date = new Date(Date.UTC(1970, 0, 1, 23, 59, 0));
    expect(dateToTimeString(date)).toBe('23:59');
  });
});

// ============================================================================
// Unit Tests: Duration Calculation
// ============================================================================

describe('calculateDurationMinutes', () => {
  it('should calculate duration correctly for normal times', () => {
    expect(calculateDurationMinutes('09:00', '17:00')).toBe(480); // 8 hours
  });

  it('should calculate duration for short interval', () => {
    expect(calculateDurationMinutes('09:00', '09:30')).toBe(30);
  });

  it('should calculate duration for 1 minute', () => {
    expect(calculateDurationMinutes('12:00', '12:01')).toBe(1);
  });

  it('should return negative for end before start', () => {
    expect(calculateDurationMinutes('14:00', '09:00')).toBe(-300); // -5 hours
  });

  it('should return 0 for same times', () => {
    expect(calculateDurationMinutes('10:00', '10:00')).toBe(0);
  });

  it('should return 0 for invalid start time format', () => {
    expect(calculateDurationMinutes('invalid', '10:00')).toBe(0);
  });

  it('should return 0 for invalid end time format', () => {
    expect(calculateDurationMinutes('10:00', 'invalid')).toBe(0);
  });

  it('should calculate full day duration', () => {
    expect(calculateDurationMinutes('00:00', '23:59')).toBe(1439);
  });
});

// ============================================================================
// Unit Tests: Overlap Validation
// ============================================================================

describe('timeRangesOverlap', () => {
  describe('non-overlapping cases', () => {
    it('should return false when ranges are completely separate', () => {
      // Range 1: 09:00-12:00, Range 2: 14:00-18:00
      expect(timeRangesOverlap('09:00', '12:00', '14:00', '18:00')).toBe(false);
    });

    it('should return false when first range ends as second starts (adjacent)', () => {
      // Range 1: 09:00-12:00, Range 2: 12:00-14:00
      expect(timeRangesOverlap('09:00', '12:00', '12:00', '14:00')).toBe(false);
    });

    it('should return false when second range ends as first starts (adjacent reverse)', () => {
      // Range 1: 14:00-18:00, Range 2: 09:00-14:00
      expect(timeRangesOverlap('14:00', '18:00', '09:00', '14:00')).toBe(false);
    });

    it('should return false when ranges are far apart', () => {
      expect(timeRangesOverlap('08:00', '09:00', '20:00', '21:00')).toBe(false);
    });
  });

  describe('overlapping cases', () => {
    it('should return true when first range contains second', () => {
      // Range 1: 09:00-18:00 contains Range 2: 10:00-12:00
      expect(timeRangesOverlap('09:00', '18:00', '10:00', '12:00')).toBe(true);
    });

    it('should return true when second range contains first', () => {
      // Range 2: 09:00-18:00 contains Range 1: 10:00-12:00
      expect(timeRangesOverlap('10:00', '12:00', '09:00', '18:00')).toBe(true);
    });

    it('should return true when ranges partially overlap (first starts before)', () => {
      // Range 1: 09:00-14:00, Range 2: 12:00-18:00
      expect(timeRangesOverlap('09:00', '14:00', '12:00', '18:00')).toBe(true);
    });

    it('should return true when ranges partially overlap (second starts before)', () => {
      // Range 1: 12:00-18:00, Range 2: 09:00-14:00
      expect(timeRangesOverlap('12:00', '18:00', '09:00', '14:00')).toBe(true);
    });

    it('should return true for identical ranges', () => {
      expect(timeRangesOverlap('09:00', '17:00', '09:00', '17:00')).toBe(true);
    });

    it('should return true when ranges share same start time', () => {
      expect(timeRangesOverlap('09:00', '12:00', '09:00', '14:00')).toBe(true);
    });

    it('should return true when ranges share same end time', () => {
      expect(timeRangesOverlap('09:00', '14:00', '12:00', '14:00')).toBe(true);
    });

    it('should return true for 1 minute overlap', () => {
      // Range 1: 09:00-12:01, Range 2: 12:00-14:00 (overlap at 12:00-12:01)
      expect(timeRangesOverlap('09:00', '12:01', '12:00', '14:00')).toBe(true);
    });
  });
});

// ============================================================================
// Unit Tests: Roundtrip Conversion
// ============================================================================

describe('time conversion roundtrip', () => {
  it('should preserve time through string -> date -> string conversion', () => {
    const originalTimes = ['00:00', '09:30', '12:45', '18:00', '23:59'];
    
    for (const time of originalTimes) {
      const date = timeStringToDate(time);
      const result = dateToTimeString(date);
      expect(result).toBe(time);
    }
  });
});
