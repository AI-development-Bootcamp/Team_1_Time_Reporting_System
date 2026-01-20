import { describe, it, expect } from 'vitest';
import {
  TIME_REGEX,
  timeStringToDate,
  dateToTimeString,
  calculateDurationMinutes,
  timeRangesOverlap,
  validateTimeRange,
  validateNoMidnightCrossing,
  calculateDurationFromDates,
} from './TimeValidation';

// ============================================================================
// Unit Tests: TIME_REGEX
// ============================================================================

describe('TIME_REGEX', () => {
  it('should match valid HH:mm formats', () => {
    expect(TIME_REGEX.test('00:00')).toBe(true);
    expect(TIME_REGEX.test('09:30')).toBe(true);
    expect(TIME_REGEX.test('12:00')).toBe(true);
    expect(TIME_REGEX.test('23:59')).toBe(true);
  });

  it('should not match invalid formats', () => {
    expect(TIME_REGEX.test('24:00')).toBe(false);
    expect(TIME_REGEX.test('25:00')).toBe(false);
    expect(TIME_REGEX.test('9:30')).toBe(false);
    expect(TIME_REGEX.test('09:60')).toBe(false);
    expect(TIME_REGEX.test('0930')).toBe(false);
    expect(TIME_REGEX.test('')).toBe(false);
  });
});

// ============================================================================
// Unit Tests: timeStringToDate
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

  it('should throw AppError for invalid time format', () => {
    expect(() => timeStringToDate('0930')).toThrow('Invalid time format');
    expect(() => timeStringToDate('9:30')).toThrow('Invalid time format');
    expect(() => timeStringToDate('25:00')).toThrow('Invalid time format');
    expect(() => timeStringToDate('09:60')).toThrow('Invalid time format');
    expect(() => timeStringToDate('')).toThrow('Invalid time format');
  });
});

// ============================================================================
// Unit Tests: dateToTimeString
// ============================================================================

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
// Unit Tests: calculateDurationMinutes
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

  it('should return 0 for invalid time format', () => {
    expect(calculateDurationMinutes('invalid', '10:00')).toBe(0);
    expect(calculateDurationMinutes('10:00', 'invalid')).toBe(0);
  });

  it('should calculate full day duration', () => {
    expect(calculateDurationMinutes('00:00', '23:59')).toBe(1439);
  });
});

// ============================================================================
// Unit Tests: timeRangesOverlap
// ============================================================================

describe('timeRangesOverlap', () => {
  describe('non-overlapping cases', () => {
    it('should return false when ranges are completely separate', () => {
      expect(timeRangesOverlap('09:00', '12:00', '14:00', '18:00')).toBe(false);
    });

    it('should return false when first range ends as second starts (adjacent)', () => {
      expect(timeRangesOverlap('09:00', '12:00', '12:00', '14:00')).toBe(false);
    });

    it('should return false when second range ends as first starts', () => {
      expect(timeRangesOverlap('14:00', '18:00', '09:00', '14:00')).toBe(false);
    });
  });

  describe('overlapping cases', () => {
    it('should return true when first range contains second', () => {
      expect(timeRangesOverlap('09:00', '18:00', '10:00', '12:00')).toBe(true);
    });

    it('should return true when second range contains first', () => {
      expect(timeRangesOverlap('10:00', '12:00', '09:00', '18:00')).toBe(true);
    });

    it('should return true when ranges partially overlap', () => {
      expect(timeRangesOverlap('09:00', '14:00', '12:00', '18:00')).toBe(true);
    });

    it('should return true for identical ranges', () => {
      expect(timeRangesOverlap('09:00', '17:00', '09:00', '17:00')).toBe(true);
    });

    it('should return true when ranges share same start time', () => {
      expect(timeRangesOverlap('09:00', '12:00', '09:00', '14:00')).toBe(true);
    });

    it('should return true for 1 minute overlap', () => {
      expect(timeRangesOverlap('09:00', '12:01', '12:00', '14:00')).toBe(true);
    });
  });
});

// ============================================================================
// Unit Tests: validateTimeRange
// ============================================================================

describe('validateTimeRange', () => {
  it('should not throw for valid time range (end > start)', () => {
    expect(() => validateTimeRange('09:00', '17:00')).not.toThrow();
    expect(() => validateTimeRange('00:00', '23:59')).not.toThrow();
    expect(() => validateTimeRange('12:00', '12:01')).not.toThrow();
  });

  it('should throw when end time equals start time', () => {
    expect(() => validateTimeRange('09:00', '09:00')).toThrow('End time must be after start time');
  });

  it('should throw when end time is before start time', () => {
    expect(() => validateTimeRange('17:00', '09:00')).toThrow('End time must be after start time');
    expect(() => validateTimeRange('14:00', '12:00')).toThrow('End time must be after start time');
  });
});

// ============================================================================
// Unit Tests: validateNoMidnightCrossing
// ============================================================================

describe('validateNoMidnightCrossing', () => {
  it('should not throw for valid end times within the day', () => {
    expect(() => validateNoMidnightCrossing('00:00')).not.toThrow();
    expect(() => validateNoMidnightCrossing('12:00')).not.toThrow();
    expect(() => validateNoMidnightCrossing('23:59')).not.toThrow();
  });

  it('should throw for invalid time format', () => {
    expect(() => validateNoMidnightCrossing('24:00')).toThrow('Invalid time format');
    expect(() => validateNoMidnightCrossing('25:00')).toThrow('Invalid time format');
    expect(() => validateNoMidnightCrossing('invalid')).toThrow('Invalid time format');
  });

  // Note: The TIME_REGEX already rejects 24:00 and above, so the midnight crossing
  // validation primarily catches invalid formats. Valid HH:mm times by definition
  // are always <= 23:59.
});

// ============================================================================
// Unit Tests: calculateDurationFromDates
// ============================================================================

describe('calculateDurationFromDates', () => {
  it('should calculate duration correctly', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
    const end = new Date(Date.UTC(1970, 0, 1, 17, 0, 0));
    expect(calculateDurationFromDates(start, end)).toBe(480);
  });

  it('should return 0 for null start time', () => {
    const end = new Date(Date.UTC(1970, 0, 1, 17, 0, 0));
    expect(calculateDurationFromDates(null, end)).toBe(0);
  });

  it('should return 0 for null end time', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
    expect(calculateDurationFromDates(start, null)).toBe(0);
  });

  it('should return 0 for both null times', () => {
    expect(calculateDurationFromDates(null, null)).toBe(0);
  });

  it('should calculate duration with minutes', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 9, 30, 0));
    const end = new Date(Date.UTC(1970, 0, 1, 14, 45, 0));
    expect(calculateDurationFromDates(start, end)).toBe(315);
  });
});

// ============================================================================
// Unit Tests: Roundtrip Conversion
// ============================================================================

describe('time conversion roundtrip', () => {
  it('should preserve time through string -> date -> string conversion', () => {
    const times = ['00:00', '09:30', '12:45', '18:00', '23:59'];
    
    for (const time of times) {
      const date = timeStringToDate(time);
      const result = dateToTimeString(date);
      expect(result).toBe(time);
    }
  });
});
