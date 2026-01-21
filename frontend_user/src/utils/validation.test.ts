import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateTimeRange,
  validateDuration,
  validateTimeFormat,
  parseDurationToMinutes,
  validateRequiredFields,
  isProjectReportValid,
  calculateTotalDuration,
  calculateTargetDuration,
  validateTrackerComplete,
  calculateProgressPercentage,
  validateDateFormat,
  validateNotFutureDate,
} from './validation';
import { ProjectReportItem } from '../types/dailyReport';

describe('validation utilities', () => {
  // ============================================================================
  // Time Range Validation
  // ============================================================================

  describe('validateTimeRange', () => {
    it('returns empty string for valid time range', () => {
      expect(validateTimeRange('09:00', '17:00')).toBe('');
      expect(validateTimeRange('08:30', '16:45')).toBe('');
    });

    it('returns error when end time equals start time', () => {
      expect(validateTimeRange('09:00', '09:00')).toBe('End time must be after start time');
    });

    it('returns error when end time is before start time', () => {
      expect(validateTimeRange('17:00', '09:00')).toBe('End time must be after start time');
    });

    it('returns error when start time is missing', () => {
      expect(validateTimeRange('', '17:00')).toBe('Start and end times are required');
    });

    it('returns error when end time is missing', () => {
      expect(validateTimeRange('09:00', '')).toBe('Start and end times are required');
    });

    it('returns error when both times are missing', () => {
      expect(validateTimeRange('', '')).toBe('Start and end times are required');
    });

    it('handles edge case with 1 minute difference', () => {
      expect(validateTimeRange('09:00', '09:01')).toBe('');
    });
  });

  // ============================================================================
  // Duration Validation
  // ============================================================================

  describe('validateDuration', () => {
    it('returns empty string for valid duration', () => {
      expect(validateDuration('08:30')).toBe('');
      expect(validateDuration('00:15')).toBe('');
      expect(validateDuration('23:59')).toBe('');
    });

    it('returns error for invalid format', () => {
      expect(validateDuration('8:30')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
      expect(validateDuration('25:00')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
      expect(validateDuration('12:60')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
      expect(validateDuration('abc')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
    });

    it('returns error for empty duration', () => {
      expect(validateDuration('')).toBe('Duration is required');
    });

    it('accepts 00:00 as valid format', () => {
      expect(validateDuration('00:00')).toBe('');
    });

    it('accepts maximum valid duration 23:59', () => {
      expect(validateDuration('23:59')).toBe('');
    });

    it('rejects hours > 23', () => {
      expect(validateDuration('24:00')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
    });
  });

  // ============================================================================
  // Time Format Validation
  // ============================================================================

  describe('validateTimeFormat', () => {
    it('returns empty string for valid time', () => {
      expect(validateTimeFormat('09:00')).toBe('');
      expect(validateTimeFormat('23:59')).toBe('');
      expect(validateTimeFormat('00:00')).toBe('');
    });

    it('returns error for invalid format', () => {
      expect(validateTimeFormat('9:00')).toBe('Invalid format. Use HH:mm (e.g., 09:00)');
      expect(validateTimeFormat('25:00')).toBe('Invalid format. Use HH:mm (e.g., 09:00)');
      expect(validateTimeFormat('12:60')).toBe('Invalid format. Use HH:mm (e.g., 09:00)');
    });

    it('returns error for empty time', () => {
      expect(validateTimeFormat('')).toBe('Time is required');
    });
  });

  // ============================================================================
  // Duration Parsing
  // ============================================================================

  describe('parseDurationToMinutes', () => {
    it('parses duration correctly', () => {
      expect(parseDurationToMinutes('08:30')).toBe(510); // 8*60 + 30
      expect(parseDurationToMinutes('01:15')).toBe(75);
      expect(parseDurationToMinutes('00:45')).toBe(45);
    });

    it('returns 0 for empty string', () => {
      expect(parseDurationToMinutes('')).toBe(0);
    });

    it('returns 0 for invalid format', () => {
      expect(parseDurationToMinutes('abc')).toBe(0);
      expect(parseDurationToMinutes('invalid')).toBe(0);
    });

    it('handles 00:00', () => {
      expect(parseDurationToMinutes('00:00')).toBe(0);
    });

    it('handles maximum duration 23:59', () => {
      expect(parseDurationToMinutes('23:59')).toBe(1439); // 23*60 + 59
    });
  });

  // ============================================================================
  // Project Report Validation
  // ============================================================================

  describe('validateRequiredFields', () => {
    it('returns no errors for valid duration-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'duration',
        duration: 480,
      };
      const errors = validateRequiredFields(report);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns no errors for valid startEnd-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'startEnd',
        startTime: '09:00',
        endTime: '17:00',
      };
      const errors = validateRequiredFields(report);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns error for missing projectId', () => {
      const report: Partial<ProjectReportItem> = {
        taskId: '1',
        location: 'office',
        reportingType: 'duration',
        duration: 480,
      };
      const errors = validateRequiredFields(report);
      expect(errors.projectId).toBe('Project is required');
    });

    it('returns error for missing taskId', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        location: 'office',
        reportingType: 'duration',
        duration: 480,
      };
      const errors = validateRequiredFields(report);
      expect(errors.taskId).toBe('Task is required');
    });

    it('returns error for missing location', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        reportingType: 'duration',
        duration: 480,
      };
      const errors = validateRequiredFields(report);
      expect(errors.location).toBe('Location is required');
    });

    it('returns error for missing duration in duration-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'duration',
      };
      const errors = validateRequiredFields(report);
      expect(errors.duration).toBe('Duration is required');
    });

    it('returns error for zero duration in duration-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'duration',
        duration: 0,
      };
      const errors = validateRequiredFields(report);
      expect(errors.duration).toBe('Duration must be greater than 0');
    });

    it('returns error for missing startTime in startEnd-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'startEnd',
        endTime: '17:00',
      };
      const errors = validateRequiredFields(report);
      expect(errors.startTime).toBe('Start time is required');
    });

    it('returns error for missing endTime in startEnd-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'startEnd',
        startTime: '09:00',
      };
      const errors = validateRequiredFields(report);
      expect(errors.endTime).toBe('End time is required');
    });

    it('returns error for invalid time range in startEnd-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'startEnd',
        startTime: '17:00',
        endTime: '09:00',
      };
      const errors = validateRequiredFields(report);
      expect(errors.endTime).toBe('End time must be after start time');
    });

    it('returns multiple errors when multiple fields are missing', () => {
      const report: Partial<ProjectReportItem> = {
        reportingType: 'duration',
      };
      const errors = validateRequiredFields(report);
      expect(errors.projectId).toBeDefined();
      expect(errors.taskId).toBeDefined();
      expect(errors.location).toBeDefined();
      expect(errors.duration).toBeDefined();
    });
  });

  describe('isProjectReportValid', () => {
    it('returns true for valid duration-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'duration',
        duration: 480,
      };
      expect(isProjectReportValid(report)).toBe(true);
    });

    it('returns true for valid startEnd-based report', () => {
      const report: Partial<ProjectReportItem> = {
        projectId: '1',
        taskId: '1',
        location: 'office',
        reportingType: 'startEnd',
        startTime: '09:00',
        endTime: '17:00',
      };
      expect(isProjectReportValid(report)).toBe(true);
    });

    it('returns false for invalid report', () => {
      const report: Partial<ProjectReportItem> = {
        reportingType: 'duration',
      };
      expect(isProjectReportValid(report)).toBe(false);
    });
  });

  // ============================================================================
  // Duration Calculation
  // ============================================================================

  describe('calculateTotalDuration', () => {
    it('returns 0 for empty array', () => {
      expect(calculateTotalDuration([])).toBe(0);
    });

    it('calculates total for duration-based reports', () => {
      const reports: ProjectReportItem[] = [
        {
          clientId: '1',
          clientName: 'Client A',
          projectId: '1',
          projectName: 'Project A',
          taskId: '1',
          taskName: 'Task A',
          reportingType: 'duration',
          location: 'office',
          duration: 240, // 4 hours
        },
        {
          clientId: '1',
          clientName: 'Client A',
          projectId: '1',
          projectName: 'Project A',
          taskId: '2',
          taskName: 'Task B',
          reportingType: 'duration',
          location: 'home',
          duration: 180, // 3 hours
        },
      ];
      expect(calculateTotalDuration(reports)).toBe(420); // 7 hours
    });

    it('calculates total for startEnd-based reports', () => {
      const reports: ProjectReportItem[] = [
        {
          clientId: '1',
          clientName: 'Client A',
          projectId: '1',
          projectName: 'Project A',
          taskId: '1',
          taskName: 'Task A',
          reportingType: 'startEnd',
          location: 'office',
          startTime: '09:00',
          endTime: '12:00', // 3 hours
        },
        {
          clientId: '1',
          clientName: 'Client A',
          projectId: '1',
          projectName: 'Project A',
          taskId: '2',
          taskName: 'Task B',
          reportingType: 'startEnd',
          location: 'client',
          startTime: '13:00',
          endTime: '17:00', // 4 hours
        },
      ];
      expect(calculateTotalDuration(reports)).toBe(420); // 7 hours
    });

    it('calculates total for mixed reporting types', () => {
      const reports: ProjectReportItem[] = [
        {
          clientId: '1',
          clientName: 'Client A',
          projectId: '1',
          projectName: 'Project A',
          taskId: '1',
          taskName: 'Task A',
          reportingType: 'duration',
          location: 'office',
          duration: 240, // 4 hours
        },
        {
          clientId: '1',
          clientName: 'Client A',
          projectId: '2',
          projectName: 'Project B',
          taskId: '2',
          taskName: 'Task B',
          reportingType: 'startEnd',
          location: 'home',
          startTime: '13:00',
          endTime: '16:00', // 3 hours
        },
      ];
      expect(calculateTotalDuration(reports)).toBe(420); // 7 hours
    });

    it('ignores reports with missing time data', () => {
      const reports: ProjectReportItem[] = [
        {
          clientId: '1',
          clientName: 'Client A',
          projectId: '1',
          projectName: 'Project A',
          taskId: '1',
          taskName: 'Task A',
          reportingType: 'duration',
          location: 'office',
          duration: 240,
        },
        {
          clientId: '1',
          clientName: 'Client A',
          projectId: '2',
          projectName: 'Project B',
          taskId: '2',
          taskName: 'Task B',
          reportingType: 'startEnd',
          location: 'home',
          // Missing startTime and endTime
        },
      ];
      expect(calculateTotalDuration(reports)).toBe(240);
    });
  });

  describe('calculateTargetDuration', () => {
    it('calculates target duration correctly', () => {
      expect(calculateTargetDuration('09:00', '17:00')).toBe(480); // 8 hours
      expect(calculateTargetDuration('08:30', '16:45')).toBe(495); // 8 hours 15 minutes
    });

    it('returns 0 for missing entrance time', () => {
      expect(calculateTargetDuration('', '17:00')).toBe(0);
    });

    it('returns 0 for missing exit time', () => {
      expect(calculateTargetDuration('09:00', '')).toBe(0);
    });

    it('returns 0 for negative duration', () => {
      expect(calculateTargetDuration('17:00', '09:00')).toBe(0);
    });

    it('returns 0 for same entrance and exit time', () => {
      expect(calculateTargetDuration('09:00', '09:00')).toBe(0);
    });
  });

  // ============================================================================
  // Tracker Validation
  // ============================================================================

  describe('validateTrackerComplete', () => {
    it('returns complete when total equals target', () => {
      const result = validateTrackerComplete(480, 480);
      expect(result.isComplete).toBe(true);
      expect(result.missingMinutes).toBe(0);
      expect(result.missingPercentage).toBe(0);
    });

    it('returns complete when total exceeds target', () => {
      const result = validateTrackerComplete(500, 480);
      expect(result.isComplete).toBe(true);
      expect(result.missingMinutes).toBe(0);
      expect(result.missingPercentage).toBe(0);
    });

    it('returns incomplete when total is less than target', () => {
      const result = validateTrackerComplete(240, 480);
      expect(result.isComplete).toBe(false);
      expect(result.missingMinutes).toBe(240);
      expect(result.missingPercentage).toBe(50);
    });

    it('handles zero target', () => {
      const result = validateTrackerComplete(0, 0);
      expect(result.isComplete).toBe(true);
      expect(result.missingMinutes).toBe(0);
      expect(result.missingPercentage).toBe(0);
    });

    it('calculates correct percentage for partial completion', () => {
      const result = validateTrackerComplete(360, 480); // 75%
      expect(result.isComplete).toBe(false);
      expect(result.missingMinutes).toBe(120);
      expect(result.missingPercentage).toBe(25);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('returns 0 for zero target', () => {
      expect(calculateProgressPercentage(100, 0)).toBe(0);
    });

    it('calculates percentage correctly', () => {
      expect(calculateProgressPercentage(240, 480)).toBe(50);
      expect(calculateProgressPercentage(360, 480)).toBe(75);
      expect(calculateProgressPercentage(120, 480)).toBe(25);
    });

    it('caps at 100% when total exceeds target', () => {
      expect(calculateProgressPercentage(500, 480)).toBe(100);
      expect(calculateProgressPercentage(600, 480)).toBe(100);
    });

    it('returns 100% when total equals target', () => {
      expect(calculateProgressPercentage(480, 480)).toBe(100);
    });

    it('returns 0% when total is 0', () => {
      expect(calculateProgressPercentage(0, 480)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      expect(calculateProgressPercentage(333, 1000)).toBe(33); // 33.3 -> 33
      expect(calculateProgressPercentage(667, 1000)).toBe(67); // 66.7 -> 67
    });
  });

  // ============================================================================
  // Date Validation
  // ============================================================================

  describe('validateDateFormat', () => {
    it('returns empty string for valid date', () => {
      expect(validateDateFormat('2026-01-21')).toBe('');
      expect(validateDateFormat('2025-12-31')).toBe('');
    });

    it('returns error for invalid format', () => {
      expect(validateDateFormat('21-01-2026')).toBe('Invalid format. Use YYYY-MM-DD');
      expect(validateDateFormat('2026/01/21')).toBe('Invalid format. Use YYYY-MM-DD');
      expect(validateDateFormat('21.01.2026')).toBe('Invalid format. Use YYYY-MM-DD');
    });

    it('returns error for empty date', () => {
      expect(validateDateFormat('')).toBe('Date is required');
    });

    it('returns error for invalid date values', () => {
      expect(validateDateFormat('2026-13-01')).toBe('Invalid date');
      expect(validateDateFormat('2026-02-30')).toBe('Invalid date');
    });
  });

  describe('validateNotFutureDate', () => {
    beforeEach(() => {
      // Mock current date to 2026-01-21
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-21T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns empty string for today', () => {
      expect(validateNotFutureDate('2026-01-21')).toBe('');
    });

    it('returns empty string for past date', () => {
      expect(validateNotFutureDate('2026-01-20')).toBe('');
      expect(validateNotFutureDate('2025-12-31')).toBe('');
    });

    it('returns error for future date', () => {
      expect(validateNotFutureDate('2026-01-22')).toBe('Cannot report for future dates');
      expect(validateNotFutureDate('2026-02-01')).toBe('Cannot report for future dates');
    });

    it('returns error for invalid format', () => {
      expect(validateNotFutureDate('21-01-2026')).toBe('Invalid format. Use YYYY-MM-DD');
    });

    it('returns error for empty date', () => {
      expect(validateNotFutureDate('')).toBe('Date is required');
    });
  });
});
