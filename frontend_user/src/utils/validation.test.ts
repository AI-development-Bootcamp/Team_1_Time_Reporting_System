/**
 * Unit tests for validation.ts
 * Tests all validation functions with edge cases
 */

import { describe, it, expect } from 'vitest';
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

// ============================================================================
// Time Validation Tests
// ============================================================================

describe('validateTimeRange', () => {
  it('should validate valid time range', () => {
    expect(validateTimeRange('09:00', '17:00')).toBe('');
    expect(validateTimeRange('00:00', '23:59')).toBe('');
    expect(validateTimeRange('12:30', '12:31')).toBe('');
  });

  it('should return error when end time is before start time', () => {
    expect(validateTimeRange('17:00', '09:00')).toBe('End time must be after start time');
    expect(validateTimeRange('12:00', '12:00')).toBe('End time must be after start time');
  });

  it('should return error when times are missing', () => {
    expect(validateTimeRange('', '17:00')).toBe('Start and end times are required');
    expect(validateTimeRange('09:00', '')).toBe('Start and end times are required');
    expect(validateTimeRange('', '')).toBe('Start and end times are required');
  });
});

describe('validateDuration', () => {
  it('should validate valid duration format', () => {
    expect(validateDuration('08:30')).toBe('');
    expect(validateDuration('00:00')).toBe('');
    expect(validateDuration('23:59')).toBe('');
    expect(validateDuration('12:45')).toBe('');
  });

  it('should return error for invalid format', () => {
    expect(validateDuration('8:30')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
    expect(validateDuration('08:5')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
    expect(validateDuration('25:00')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
    expect(validateDuration('12:60')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
    expect(validateDuration('invalid')).toBe('Invalid format. Use HH:mm (e.g., 08:30)');
  });

  it('should return error when empty', () => {
    expect(validateDuration('')).toBe('Duration is required');
  });

  it('should accept max valid duration (23:59)', () => {
    expect(validateDuration('23:59')).toBe('');
  });
});

describe('validateTimeFormat', () => {
  it('should validate valid time format', () => {
    expect(validateTimeFormat('09:00')).toBe('');
    expect(validateTimeFormat('00:00')).toBe('');
    expect(validateTimeFormat('23:59')).toBe('');
  });

  it('should return error for invalid format', () => {
    expect(validateTimeFormat('9:00')).toBe('Invalid format. Use HH:mm (e.g., 09:00)');
    expect(validateTimeFormat('24:00')).toBe('Invalid format. Use HH:mm (e.g., 09:00)');
    expect(validateTimeFormat('12:60')).toBe('Invalid format. Use HH:mm (e.g., 09:00)');
    expect(validateTimeFormat('invalid')).toBe('Invalid format. Use HH:mm (e.g., 09:00)');
  });

  it('should return error when empty', () => {
    expect(validateTimeFormat('')).toBe('Time is required');
  });
});

describe('parseDurationToMinutes', () => {
  it('should parse valid duration to minutes', () => {
    expect(parseDurationToMinutes('08:30')).toBe(510);
    expect(parseDurationToMinutes('00:45')).toBe(45);
    expect(parseDurationToMinutes('01:00')).toBe(60);
    expect(parseDurationToMinutes('00:00')).toBe(0);
    expect(parseDurationToMinutes('23:59')).toBe(1439);
  });

  it('should return 0 for empty string', () => {
    expect(parseDurationToMinutes('')).toBe(0);
  });

  it('should return 0 for invalid format', () => {
    expect(parseDurationToMinutes('invalid')).toBe(0);
    expect(parseDurationToMinutes('abc:def')).toBe(0);
  });
});

// ============================================================================
// Project Report Validation Tests
// ============================================================================

describe('validateRequiredFields', () => {
  it('should validate complete duration-based project report', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      location: 'office',
      reportingType: 'duration',
      duration: 480,
    };
    const errors = validateRequiredFields(report);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('should validate complete startEnd-based project report', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      location: 'office',
      reportingType: 'startEnd',
      startTime: '09:00',
      endTime: '17:00',
    };
    const errors = validateRequiredFields(report);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('should return error for missing projectId', () => {
    const report: Partial<ProjectReportItem> = {
      taskId: 'task-1',
      location: 'office',
      reportingType: 'duration',
      duration: 480,
    };
    const errors = validateRequiredFields(report);
    expect(errors.projectId).toBe('Project is required');
  });

  it('should return error for missing taskId', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      location: 'office',
      reportingType: 'duration',
      duration: 480,
    };
    const errors = validateRequiredFields(report);
    expect(errors.taskId).toBe('Task is required');
  });

  it('should return error for missing location', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      reportingType: 'duration',
      duration: 480,
    };
    const errors = validateRequiredFields(report);
    expect(errors.location).toBe('Location is required');
  });

  it('should return error for missing duration in duration-based report', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      location: 'office',
      reportingType: 'duration',
    };
    const errors = validateRequiredFields(report);
    expect(errors.duration).toBe('Duration is required');
  });

  it('should return error for zero duration', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      location: 'office',
      reportingType: 'duration',
      duration: 0,
    };
    const errors = validateRequiredFields(report);
    expect(errors.duration).toBe('Duration must be greater than 0');
  });

  it('should return error for missing times in startEnd-based report', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      location: 'office',
      reportingType: 'startEnd',
    };
    const errors = validateRequiredFields(report);
    expect(errors.startTime).toBe('Start time is required');
    expect(errors.endTime).toBe('End time is required');
  });

  it('should return error for invalid time range in startEnd report', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      location: 'office',
      reportingType: 'startEnd',
      startTime: '17:00',
      endTime: '09:00',
    };
    const errors = validateRequiredFields(report);
    expect(errors.endTime).toBe('End time must be after start time');
  });
});

describe('isProjectReportValid', () => {
  it('should return true for valid duration-based report', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      location: 'office',
      reportingType: 'duration',
      duration: 480,
    };
    expect(isProjectReportValid(report)).toBe(true);
  });

  it('should return true for valid startEnd-based report', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      taskId: 'task-1',
      location: 'office',
      reportingType: 'startEnd',
      startTime: '09:00',
      endTime: '17:00',
    };
    expect(isProjectReportValid(report)).toBe(true);
  });

  it('should return false for invalid report', () => {
    const report: Partial<ProjectReportItem> = {
      projectId: 'proj-1',
      reportingType: 'duration',
    };
    expect(isProjectReportValid(report)).toBe(false);
  });
});

// ============================================================================
// Duration Calculation Tests
// ============================================================================

describe('calculateTotalDuration', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotalDuration([])).toBe(0);
  });

  it('should calculate total duration for duration-based reports', () => {
    const reports: ProjectReportItem[] = [
      {
        clientId: 'c1',
        clientName: 'Client 1',
        projectId: 'p1',
        projectName: 'Project 1',
        taskId: 't1',
        taskName: 'Task 1',
        reportingType: 'duration',
        location: 'office',
        duration: 240,
      },
      {
        clientId: 'c1',
        clientName: 'Client 1',
        projectId: 'p2',
        projectName: 'Project 2',
        taskId: 't2',
        taskName: 'Task 2',
        reportingType: 'duration',
        location: 'office',
        duration: 180,
      },
    ];
    expect(calculateTotalDuration(reports)).toBe(420);
  });

  it('should calculate total duration for startEnd-based reports', () => {
    const reports: ProjectReportItem[] = [
      {
        clientId: 'c1',
        clientName: 'Client 1',
        projectId: 'p1',
        projectName: 'Project 1',
        taskId: 't1',
        taskName: 'Task 1',
        reportingType: 'startEnd',
        location: 'office',
        startTime: '09:00',
        endTime: '12:00',
      },
    ];
    expect(calculateTotalDuration(reports)).toBe(180);
  });

  it('should calculate total duration for mixed report types', () => {
    const reports: ProjectReportItem[] = [
      {
        clientId: 'c1',
        clientName: 'Client 1',
        projectId: 'p1',
        projectName: 'Project 1',
        taskId: 't1',
        taskName: 'Task 1',
        reportingType: 'duration',
        location: 'office',
        duration: 240,
      },
      {
        clientId: 'c1',
        clientName: 'Client 1',
        projectId: 'p2',
        projectName: 'Project 2',
        taskId: 't2',
        taskName: 'Task 2',
        reportingType: 'startEnd',
        location: 'office',
        startTime: '13:00',
        endTime: '15:00',
      },
    ];
    expect(calculateTotalDuration(reports)).toBe(360);
  });
});

describe('calculateTargetDuration', () => {
  it('should calculate target duration from entrance and exit times', () => {
    expect(calculateTargetDuration('09:00', '17:00')).toBe(480);
    expect(calculateTargetDuration('08:00', '16:30')).toBe(510);
  });

  it('should return 0 for missing times', () => {
    expect(calculateTargetDuration('', '17:00')).toBe(0);
    expect(calculateTargetDuration('09:00', '')).toBe(0);
    expect(calculateTargetDuration('', '')).toBe(0);
  });

  it('should return 0 for invalid time range', () => {
    expect(calculateTargetDuration('17:00', '09:00')).toBe(0);
  });
});

// ============================================================================
// Tracker Validation Tests
// ============================================================================

describe('validateTrackerComplete', () => {
  it('should return complete when total >= target', () => {
    const result = validateTrackerComplete(480, 480);
    expect(result.isComplete).toBe(true);
    expect(result.missingMinutes).toBe(0);
    expect(result.missingPercentage).toBe(0);
  });

  it('should return incomplete when total < target', () => {
    const result = validateTrackerComplete(240, 480);
    expect(result.isComplete).toBe(false);
    expect(result.missingMinutes).toBe(240);
    expect(result.missingPercentage).toBe(50);
  });

  it('should return complete when total > target', () => {
    const result = validateTrackerComplete(500, 480);
    expect(result.isComplete).toBe(true);
    expect(result.missingMinutes).toBe(0);
  });

  it('should handle zero target', () => {
    const result = validateTrackerComplete(0, 0);
    expect(result.isComplete).toBe(true);
    expect(result.missingMinutes).toBe(0);
    expect(result.missingPercentage).toBe(0);
  });
});

describe('calculateProgressPercentage', () => {
  it('should calculate correct percentage', () => {
    expect(calculateProgressPercentage(240, 480)).toBe(50);
    expect(calculateProgressPercentage(480, 480)).toBe(100);
    expect(calculateProgressPercentage(360, 480)).toBe(75);
  });

  it('should cap at 100%', () => {
    expect(calculateProgressPercentage(600, 480)).toBe(100);
  });

  it('should return 0 for zero target', () => {
    expect(calculateProgressPercentage(100, 0)).toBe(0);
  });

  it('should return 0 for zero total', () => {
    expect(calculateProgressPercentage(0, 480)).toBe(0);
  });
});

// ============================================================================
// Date Validation Tests
// ============================================================================

describe('validateDateFormat', () => {
  it('should validate valid date format', () => {
    expect(validateDateFormat('2026-01-21')).toBe('');
    expect(validateDateFormat('2024-12-31')).toBe('');
    expect(validateDateFormat('2025-06-15')).toBe('');
  });

  it('should return error for invalid format', () => {
    expect(validateDateFormat('2026/01/21')).toBe('Invalid format. Use YYYY-MM-DD');
    expect(validateDateFormat('21-01-2026')).toBe('Invalid format. Use YYYY-MM-DD');
    expect(validateDateFormat('2026-1-21')).toBe('Invalid format. Use YYYY-MM-DD');
    expect(validateDateFormat('invalid')).toBe('Invalid format. Use YYYY-MM-DD');
  });

  it('should return error for empty date', () => {
    expect(validateDateFormat('')).toBe('Date is required');
  });

  it('should return error for invalid month', () => {
    expect(validateDateFormat('2026-00-21')).toBe('Invalid date');
    expect(validateDateFormat('2026-13-21')).toBe('Invalid date');
  });

  it('should return error for invalid day', () => {
    expect(validateDateFormat('2026-01-00')).toBe('Invalid date');
    expect(validateDateFormat('2026-01-32')).toBe('Invalid date');
    expect(validateDateFormat('2026-02-30')).toBe('Invalid date');
  });

  it('should validate leap year dates', () => {
    expect(validateDateFormat('2024-02-29')).toBe(''); // 2024 is leap year
    expect(validateDateFormat('2025-02-29')).toBe('Invalid date'); // 2025 is not
  });
});

describe('validateNotFutureDate', () => {
  it('should allow today and past dates', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(validateNotFutureDate(today)).toBe('');
    expect(validateNotFutureDate('2020-01-01')).toBe('');
  });

  it('should return error for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const futureDate = future.toISOString().split('T')[0];
    expect(validateNotFutureDate(futureDate)).toBe('Cannot report for future dates');
  });

  it('should return error for invalid format', () => {
    expect(validateNotFutureDate('invalid')).toBe('Invalid format. Use YYYY-MM-DD');
  });
});
