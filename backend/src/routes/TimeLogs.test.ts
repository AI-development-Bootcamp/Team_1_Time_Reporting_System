import { describe, it, expect } from 'vitest';
import {
  validateDuration,
  validateLocation,
  calculateAttendanceDuration,
} from './TimeLogs';

// ============================================================================
// Unit Tests: Duration Validation
// ============================================================================

describe('validateDuration', () => {
  it('should not throw for valid positive integer', () => {
    expect(() => validateDuration(1)).not.toThrow();
    expect(() => validateDuration(60)).not.toThrow();
    expect(() => validateDuration(480)).not.toThrow();
  });

  it('should throw for zero', () => {
    expect(() => validateDuration(0)).toThrow('positive integer');
  });

  it('should throw for negative numbers', () => {
    expect(() => validateDuration(-1)).toThrow('positive integer');
    expect(() => validateDuration(-100)).toThrow('positive integer');
  });

  it('should throw for non-integers', () => {
    expect(() => validateDuration(1.5)).toThrow('positive integer');
    expect(() => validateDuration(60.5)).toThrow('positive integer');
  });
});

// ============================================================================
// Unit Tests: Location Validation
// ============================================================================

describe('validateLocation', () => {
  it('should not throw for valid locations', () => {
    expect(() => validateLocation('office')).not.toThrow();
    expect(() => validateLocation('client')).not.toThrow();
    expect(() => validateLocation('home')).not.toThrow();
  });

  it('should throw for invalid location', () => {
    expect(() => validateLocation('remote')).toThrow('Location must be one of');
    expect(() => validateLocation('onsite')).toThrow('Location must be one of');
    expect(() => validateLocation('')).toThrow('Location must be one of');
    expect(() => validateLocation('Office')).toThrow('Location must be one of'); // case sensitive
  });
});

// ============================================================================
// Unit Tests: Calculate Attendance Duration
// ============================================================================

describe('calculateAttendanceDuration', () => {
  it('should calculate duration correctly for normal times', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
    const end = new Date(Date.UTC(1970, 0, 1, 17, 0, 0));
    expect(calculateAttendanceDuration(start, end)).toBe(480); // 8 hours
  });

  it('should calculate duration for 1 hour', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
    const end = new Date(Date.UTC(1970, 0, 1, 10, 0, 0));
    expect(calculateAttendanceDuration(start, end)).toBe(60);
  });

  it('should calculate duration with minutes', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 9, 30, 0));
    const end = new Date(Date.UTC(1970, 0, 1, 14, 45, 0));
    expect(calculateAttendanceDuration(start, end)).toBe(315); // 5h 15m
  });

  it('should return 0 for null start time', () => {
    const end = new Date(Date.UTC(1970, 0, 1, 17, 0, 0));
    expect(calculateAttendanceDuration(null, end)).toBe(0);
  });

  it('should return 0 for null end time', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
    expect(calculateAttendanceDuration(start, null)).toBe(0);
  });

  it('should return 0 for both null times', () => {
    expect(calculateAttendanceDuration(null, null)).toBe(0);
  });

  it('should return negative for end before start', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 17, 0, 0));
    const end = new Date(Date.UTC(1970, 0, 1, 9, 0, 0));
    expect(calculateAttendanceDuration(start, end)).toBe(-480);
  });
});
