/**
 * Validation utilities for daily report forms
 * Provides validation functions for time, duration, and required fields
 */

import { ProjectReportItem } from '../types/dailyReport';
import { calculateDurationMinutes } from './dateUtils';

// ============================================================================
// Time Validation
// ============================================================================

/**
 * Validate time range (ensure end > start)
 * @param start Start time in HH:mm format
 * @param end End time in HH:mm format
 * @returns Error message if invalid, empty string if valid
 */
export function validateTimeRange(start: string, end: string): string {
  if (!start || !end) {
    return 'Start and end times are required';
  }

  const duration = calculateDurationMinutes(start, end);
  
  if (duration <= 0) {
    return 'End time must be after start time';
  }

  return '';
}

/**
 * Validate duration format (HH:mm) and max value (23:59)
 * @param duration Duration string in HH:mm format
 * @returns Error message if invalid, empty string if valid
 */
export function validateDuration(duration: string): string {
  if (!duration) {
    return 'Duration is required';
  }

  // Check format: HH:mm
  const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(duration)) {
    return 'Invalid format. Use HH:mm (e.g., 08:30)';
  }

  // Parse hours and minutes
  const [hours, minutes] = duration.split(':').map(Number);
  
  // Check max value: 23:59
  if (hours > 23 || (hours === 23 && minutes > 59)) {
    return 'Duration cannot exceed 23:59';
  }

  return '';
}

/**
 * Validate time format (HH:mm)
 * @param time Time string in HH:mm format
 * @returns Error message if invalid, empty string if valid
 */
export function validateTimeFormat(time: string): string {
  if (!time) {
    return 'Time is required';
  }

  const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return 'Invalid format. Use HH:mm (e.g., 09:00)';
  }

  return '';
}

/**
 * Parse duration string (HH:mm) to minutes
 * @param duration Duration string in HH:mm format
 * @returns Duration in minutes, or 0 if invalid
 */
export function parseDurationToMinutes(duration: string): number {
  if (!duration) return 0;
  
  const [hours, minutes] = duration.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  
  return hours * 60 + minutes;
}

// ============================================================================
// Project Report Validation
// ============================================================================

/**
 * Validate required fields in a project report
 * @param projectReport Project report item to validate
 * @returns Object with field-specific error messages
 */
export function validateRequiredFields(projectReport: Partial<ProjectReportItem>): {
  projectId?: string;
  taskId?: string;
  location?: string;
  duration?: string;
  startTime?: string;
  endTime?: string;
} {
  const errors: Record<string, string> = {};

  // Validate project selection
  if (!projectReport.projectId) {
    errors.projectId = 'Project is required';
  }

  // Validate task selection
  if (!projectReport.taskId) {
    errors.taskId = 'Task is required';
  }

  // Validate location
  if (!projectReport.location) {
    errors.location = 'Location is required';
  }

  // Validate time entry based on reporting type
  if (projectReport.reportingType === 'duration') {
    // Duration-based project
    if (!projectReport.duration && projectReport.duration !== 0) {
      errors.duration = 'Duration is required';
    } else if (projectReport.duration === 0) {
      errors.duration = 'Duration must be greater than 0';
    }
  } else if (projectReport.reportingType === 'startEnd') {
    // StartEnd-based project
    if (!projectReport.startTime) {
      errors.startTime = 'Start time is required';
    }
    if (!projectReport.endTime) {
      errors.endTime = 'End time is required';
    }
    
    // Validate time range if both are provided
    if (projectReport.startTime && projectReport.endTime) {
      const rangeError = validateTimeRange(projectReport.startTime, projectReport.endTime);
      if (rangeError) {
        errors.endTime = rangeError;
      }
    }
  }

  return errors;
}

/**
 * Check if a project report has all required fields filled
 * @param projectReport Project report item to check
 * @returns true if valid, false otherwise
 */
export function isProjectReportValid(projectReport: Partial<ProjectReportItem>): boolean {
  const errors = validateRequiredFields(projectReport);
  return Object.keys(errors).length === 0;
}

// ============================================================================
// Duration Calculation
// ============================================================================

/**
 * Calculate total duration from project reports
 * @param projectReports Array of project report items
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(projectReports: ProjectReportItem[]): number {
  if (!projectReports || projectReports.length === 0) {
    return 0;
  }

  return projectReports.reduce((total, report) => {
    let reportDuration = 0;

    if (report.reportingType === 'duration' && report.duration !== undefined) {
      // Duration-based project - duration is already in minutes
      reportDuration = report.duration;
    } else if (report.reportingType === 'startEnd' && report.startTime && report.endTime) {
      // StartEnd-based project - calculate duration from times
      reportDuration = calculateDurationMinutes(report.startTime, report.endTime);
    }

    return total + reportDuration;
  }, 0);
}

/**
 * Calculate target duration from entrance and exit times
 * @param entranceTime Entrance time in HH:mm format
 * @param exitTime Exit time in HH:mm format
 * @returns Target duration in minutes
 */
export function calculateTargetDuration(entranceTime: string, exitTime: string): number {
  if (!entranceTime || !exitTime) {
    return 0;
  }

  const duration = calculateDurationMinutes(entranceTime, exitTime);
  return duration > 0 ? duration : 0;
}

// ============================================================================
// Tracker Validation
// ============================================================================

/**
 * Validate if tracker is complete (total >= target)
 * @param total Total reported duration in minutes
 * @param target Target duration in minutes
 * @returns Object with validation result and missing duration
 */
export function validateTrackerComplete(total: number, target: number): {
  isComplete: boolean;
  missingMinutes: number;
  missingPercentage: number;
} {
  const isComplete = total >= target;
  const missingMinutes = isComplete ? 0 : target - total;
  const missingPercentage = target > 0 ? Math.round((missingMinutes / target) * 100) : 0;

  return {
    isComplete,
    missingMinutes,
    missingPercentage,
  };
}

/**
 * Calculate progress percentage
 * @param total Total reported duration in minutes
 * @param target Target duration in minutes
 * @returns Progress percentage (0-100), capped at 100
 */
export function calculateProgressPercentage(total: number, target: number): number {
  if (target <= 0) return 0;
  
  const percentage = Math.round((total / target) * 100);
  return Math.min(percentage, 100); // Cap at 100%
}

// ============================================================================
// Date Validation
// ============================================================================

/**
 * Validate date format (YYYY-MM-DD)
 * @param date Date string
 * @returns Error message if invalid, empty string if valid
 */
export function validateDateFormat(date: string): string {
  if (!date) {
    return 'Date is required';
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return 'Invalid format. Use YYYY-MM-DD';
  }

  // Parse date components
  const [year, month, day] = date.split('-').map(Number);
  
  // Validate month (1-12)
  if (month < 1 || month > 12) {
    return 'Invalid date';
  }

  // Validate day (1-31, depending on month)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return 'Invalid date';
  }

  // Check if date is valid (final sanity check)
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return 'Invalid date';
  }

  return '';
}

/**
 * Validate date is not in the future
 * @param date Date string in YYYY-MM-DD format
 * @returns Error message if invalid, empty string if valid
 */
export function validateNotFutureDate(date: string): string {
  const formatError = validateDateFormat(date);
  if (formatError) return formatError;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate > today) {
    return 'Cannot report for future dates';
  }

  return '';
}
