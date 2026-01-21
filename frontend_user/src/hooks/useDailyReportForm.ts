/**
 * useDailyReportForm Hook
 * Manages daily report form state, validation, and progress calculation
 */

import { useState, useCallback, useMemo } from 'react';
import {
  DailyReportFormData,
  ProjectReportItem,
  ValidationErrors,
} from '../types/dailyReport';
import {
  validateDateFormat,
  validateNotFutureDate,
  validateTimeFormat,
  validateTimeRange,
  validateRequiredFields,
  calculateTotalDuration,
  calculateTargetDuration,
  validateTrackerComplete,
  calculateProgressPercentage,
} from '../utils/validation';

interface UseDailyReportFormOptions {
  initialData?: Partial<DailyReportFormData>;
  mode?: 'create' | 'edit';
}

interface UseDailyReportFormReturn {
  // Form data
  formData: DailyReportFormData;
  
  // Form handlers
  setDate: (date: string) => void;
  setEntranceTime: (time: string) => void;
  setExitTime: (time: string) => void;
  addProjectReport: () => void;
  updateProjectReport: (index: number, data: Partial<ProjectReportItem>) => void;
  removeProjectReport: (index: number) => void;
  resetForm: () => void;
  
  // Progress calculation
  progress: {
    totalDuration: number; // in minutes
    targetDuration: number; // in minutes
    percentage: number; // 0-100
    isComplete: boolean;
    missingTime: number; // in minutes (0 if complete)
  };
  
  // Validation
  errors: ValidationErrors;
  isValid: boolean;
  validateForm: () => boolean;
  clearErrors: () => void;
}

/**
 * Default empty project report
 */
const createEmptyProjectReport = (): ProjectReportItem => ({
  clientId: '',
  clientName: '',
  projectId: '',
  projectName: '',
  taskId: '',
  taskName: '',
  reportingType: 'duration',
  location: 'office',
  duration: undefined,
  startTime: undefined,
  endTime: undefined,
  description: '',
  isExpanded: true,
});

/**
 * Get default form data
 */
const getDefaultFormData = (): DailyReportFormData => ({
  date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  entranceTime: '09:00',
  exitTime: '17:00',
  projectReports: [],
});

/**
 * Hook to manage daily report form state and logic
 * 
 * @param options - Configuration options
 * @returns Form state, handlers, progress, and validation
 * 
 * @example
 * const { formData, setEntranceTime, addProjectReport, progress, validateForm } = useDailyReportForm();
 * 
 * // Update entrance time
 * setEntranceTime('09:00');
 * 
 * // Add a project report
 * addProjectReport();
 * 
 * // Update project report at index 0
 * updateProjectReport(0, { taskId: 'task-1', taskName: 'Task 1', duration: 240 });
 * 
 * // Check progress
 * console.log(progress.percentage); // 50
 * 
 * // Validate before submit
 * if (validateForm()) {
 *   // Submit form
 * }
 */
export function useDailyReportForm(
  options: UseDailyReportFormOptions = {}
): UseDailyReportFormReturn {
  const { initialData } = options;

  // ============================================================================
  // Form State
  // ============================================================================

  const [formData, setFormData] = useState<DailyReportFormData>(() => ({
    ...getDefaultFormData(),
    ...initialData,
  }));

  const [errors, setErrors] = useState<ValidationErrors>({});

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const setDate = useCallback((date: string) => {
    setFormData((prev) => ({ ...prev, date }));
    setErrors((prev) => ({ ...prev, date: undefined }));
  }, []);

  const setEntranceTime = useCallback((entranceTime: string) => {
    setFormData((prev) => ({ ...prev, entranceTime }));
    setErrors((prev) => ({ ...prev, entranceTime: undefined }));
  }, []);

  const setExitTime = useCallback((exitTime: string) => {
    setFormData((prev) => ({ ...prev, exitTime }));
    setErrors((prev) => ({ ...prev, exitTime: undefined }));
  }, []);

  const addProjectReport = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      projectReports: [...prev.projectReports, createEmptyProjectReport()],
    }));
  }, []);

  const updateProjectReport = useCallback(
    (index: number, data: Partial<ProjectReportItem>) => {
      setFormData((prev) => {
        const updated = [...prev.projectReports];
        updated[index] = { ...updated[index], ...data };
        return { ...prev, projectReports: updated };
      });

      // Clear errors for this project report
      setErrors((prev) => {
        if (!prev.projectReports) return prev;
        const updated = { ...prev.projectReports };
        if (updated[index]) {
          delete updated[index];
        }
        return { ...prev, projectReports: updated };
      });
    },
    []
  );

  const removeProjectReport = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      projectReports: prev.projectReports.filter((_, i) => i !== index),
    }));

    // Clear errors for removed project report
    setErrors((prev) => {
      if (!prev.projectReports) return prev;
      const updated = { ...prev.projectReports };
      delete updated[index];
      // Reindex remaining errors
      const reindexed: ValidationErrors['projectReports'] = {};
      Object.entries(updated).forEach(([key, value]) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = value;
        } else {
          reindexed[oldIndex] = value;
        }
      });
      return { ...prev, projectReports: reindexed };
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(getDefaultFormData());
    setErrors({});
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // ============================================================================
  // Progress Calculation
  // ============================================================================

  const progress = useMemo(() => {
    const totalDuration = calculateTotalDuration(formData.projectReports);
    const targetDuration = calculateTargetDuration(
      formData.entranceTime,
      formData.exitTime
    );
    const percentage = calculateProgressPercentage(totalDuration, targetDuration);
    const isComplete = totalDuration >= targetDuration;
    const missingTime = isComplete ? 0 : targetDuration - totalDuration;

    return {
      totalDuration,
      targetDuration,
      percentage,
      isComplete,
      missingTime,
    };
  }, [formData.entranceTime, formData.exitTime, formData.projectReports]);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate date
    const dateFormatError = validateDateFormat(formData.date);
    if (dateFormatError) {
      newErrors.date = dateFormatError;
    } else {
      const futureDateError = validateNotFutureDate(formData.date);
      if (futureDateError) {
        newErrors.date = futureDateError;
      }
    }

    // Validate entrance time
    const entranceTimeError = validateTimeFormat(formData.entranceTime);
    if (entranceTimeError) {
      newErrors.entranceTime = entranceTimeError;
    }

    // Validate exit time
    const exitTimeError = validateTimeFormat(formData.exitTime);
    if (exitTimeError) {
      newErrors.exitTime = exitTimeError;
    }

    // Validate time range (exit > entrance)
    if (!entranceTimeError && !exitTimeError) {
      const timeRangeError = validateTimeRange(
        formData.entranceTime,
        formData.exitTime
      );
      if (timeRangeError) {
        newErrors.exitTime = timeRangeError;
      }
    }

    // Validate project reports
    if (formData.projectReports.length === 0) {
      newErrors.general = 'יש להוסיף לפחות דיווח פרויקט אחד';
    } else {
      const projectErrors: ValidationErrors['projectReports'] = {};

      formData.projectReports.forEach((report, index) => {
        const reportErrors = validateRequiredFields(report);
        if (Object.keys(reportErrors).length > 0) {
          projectErrors[index] = reportErrors;
        }
      });

      if (Object.keys(projectErrors).length > 0) {
        newErrors.projectReports = projectErrors;
      }
    }

    // Check tracker completion (warning, not blocking)
    const trackerError = validateTrackerComplete(
      progress.totalDuration,
      progress.targetDuration
    );
    if (trackerError) {
      // This is handled separately in UI with confirmation modal
      // Don't add to blocking errors
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, progress]);

  const isValid = useMemo(() => {
    // Quick validation check without setting errors
    if (!formData.date || !formData.entranceTime || !formData.exitTime) {
      return false;
    }

    if (formData.projectReports.length === 0) {
      return false;
    }

    // Check if all project reports have required fields
    const allReportsValid = formData.projectReports.every((report) => {
      const reportErrors = validateRequiredFields(report);
      return Object.keys(reportErrors).length === 0;
    });

    return allReportsValid;
  }, [formData]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Form data
    formData,

    // Form handlers
    setDate,
    setEntranceTime,
    setExitTime,
    addProjectReport,
    updateProjectReport,
    removeProjectReport,
    resetForm,

    // Progress
    progress,

    // Validation
    errors,
    isValid,
    validateForm,
    clearErrors,
  };
}
