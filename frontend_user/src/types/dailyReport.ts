/**
 * Daily Report Types
 * Form data types for creating and editing daily attendance reports
 */

import { DailyAttendanceStatus, LocationStatus } from './attendance';

// ============================================================================
// Work Report Tab Types
// ============================================================================

/**
 * Single project report item in the daily report form
 * Represents one project time log entry
 */
export interface ProjectReportItem {
  // Project hierarchy selection
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  reportingType: 'duration' | 'startEnd';
  
  // Required fields
  location: LocationStatus; // office | client | home
  
  // Time entry (depends on reportingType)
  duration?: number; // For duration-based projects (in minutes)
  startTime?: string; // For startEnd-based projects (HH:mm)
  endTime?: string; // For startEnd-based projects (HH:mm)
  
  // Optional fields
  description?: string;
  
  // UI state
  isExpanded?: boolean; // For accordion behavior
}

/**
 * Daily report form data for work attendance
 * Used in "דיווח עבודה" tab
 */
export interface DailyReportFormData {
  // Date selection
  date: string; // YYYY-MM-DD, default: today
  
  // Daily attendance times
  entranceTime: string; // HH:mm (e.g., "09:00")
  exitTime: string; // HH:mm (e.g., "17:00")
  
  // Project reports
  projectReports: ProjectReportItem[];
  
  // Calculated progress
  totalDuration?: number; // Sum of all project durations (in minutes)
  targetDuration?: number; // exitTime - entranceTime (in minutes)
  isComplete?: boolean; // totalDuration >= targetDuration
}

// ============================================================================
// Absence Report Tab Types
// ============================================================================

/**
 * Absence type options for the dropdown
 */
export type AbsenceType = 'sickness' | 'reserves' | 'dayOff' | 'halfDayOff';

/**
 * Date range for multi-day absence reporting
 */
export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays?: number; // Calculated from range
}

/**
 * Absence report form data
 * Used in "דיווח היעדרות" tab
 */
export interface AbsenceReportFormData {
  // Date selection
  date: string; // YYYY-MM-DD, default: today
  
  // Absence type
  absenceType: AbsenceType; // Default: 'sickness'
  
  // Document upload (optional, for sickness/reserves)
  document: File | null;
  documentUploaded?: boolean; // true if document exists on server
  
  // Multi-day reporting (optional)
  dateRange: DateRange | null;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Field-level validation errors
 * Keys are field paths (e.g., "projectReports[0].taskId")
 */
export interface ValidationErrors {
  // Daily attendance fields
  date?: string;
  entranceTime?: string;
  exitTime?: string;
  
  // Project report fields (indexed by report index)
  projectReports?: {
    [index: number]: {
      projectId?: string;
      taskId?: string;
      location?: string;
      duration?: string;
      startTime?: string;
      endTime?: string;
    };
  };
  
  // Absence report fields
  absenceType?: string;
  document?: string;
  dateRange?: string;
  
  // General errors
  general?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Create combined attendance request body
 * POST /api/attendance/combined
 */
export interface CreateCombinedAttendanceRequest {
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'work';
  timeLogs: Array<{
    taskId: string;
    duration?: number; // For duration-based projects
    startTime?: string; // For startEnd-based projects
    endTime?: string; // For startEnd-based projects
    location: LocationStatus;
    description?: string;
  }>;
}

/**
 * Create absence attendance request body
 * POST /api/attendance
 */
export interface CreateAbsenceAttendanceRequest {
  userId: string;
  date: string; // YYYY-MM-DD
  status: DailyAttendanceStatus; // sickness | reserves | dayOff | halfDayOff
  startTime?: null;
  endTime?: null;
}

/**
 * Combined attendance creation response
 */
export interface CreateCombinedAttendanceResponse {
  success: true;
  data: {
    attendanceId: string;
    timeLogIds: string[];
  };
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  success: true;
  data: {
    uploaded: boolean;
    fileName: string;
    fileSize: number;
  };
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Daily report modal state
 */
export type DailyReportMode = 'create' | 'edit';

/**
 * Active tab in daily report modal
 */
export type DailyReportTab = 'work' | 'absence';

/**
 * Project selector step (3-step wizard)
 */
export type ProjectSelectorStep = 'project' | 'task' | 'location';
