import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDailyReportForm } from './useDailyReportForm';

// Mock getCurrentTime to return consistent values
vi.mock('../utils/timeUtils', async () => {
  const actual = await vi.importActual('../utils/timeUtils');
  return {
    ...actual,
    getCurrentTime: () => '14:30',
  };
});

describe('useDailyReportForm', () => {
  beforeEach(() => {
    // Mock current date to be consistent
    vi.setSystemTime(new Date('2026-01-21T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe('initial state', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useDailyReportForm());

      expect(result.current.formData.date).toBe('2026-01-21');
      expect(result.current.formData.entranceTime).toBe('09:00');
      expect(result.current.formData.exitTime).toBe('17:00');
      expect(result.current.formData.projectReports).toEqual([]);
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(false); // No project reports
    });

    it('initializes with custom initial data', () => {
      const initialData = {
        date: '2026-01-15',
        entranceTime: '08:00',
        exitTime: '16:00',
        projectReports: [
          {
            clientId: 'client-1',
            clientName: 'Client A',
            projectId: 'project-1',
            projectName: 'Project Alpha',
            taskId: 'task-1',
            taskName: 'Task 1',
            reportingType: 'duration' as const,
            location: 'office' as const,
            duration: 480,
          },
        ],
      };

      const { result } = renderHook(() =>
        useDailyReportForm({ initialData })
      );

      expect(result.current.formData.date).toBe('2026-01-15');
      expect(result.current.formData.entranceTime).toBe('08:00');
      expect(result.current.formData.exitTime).toBe('16:00');
      expect(result.current.formData.projectReports).toHaveLength(1);
    });
  });

  // ============================================================================
  // Form Handler Tests
  // ============================================================================

  describe('form handlers', () => {
    it('updates date', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.setDate('2026-01-20');
      });

      expect(result.current.formData.date).toBe('2026-01-20');
    });

    it('updates entrance time', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.setEntranceTime('08:30');
      });

      expect(result.current.formData.entranceTime).toBe('08:30');
    });

    it('updates exit time', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.setExitTime('18:00');
      });

      expect(result.current.formData.exitTime).toBe('18:00');
    });

    it('clears field error when updating field', () => {
      const { result } = renderHook(() => useDailyReportForm());

      // Trigger validation to set errors
      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.general).toBeDefined();

      // Update date should clear date error (if there was one)
      act(() => {
        result.current.setDate('2026-01-20');
      });

      expect(result.current.errors.date).toBeUndefined();
    });

    it('resets form to default values', () => {
      const { result } = renderHook(() => useDailyReportForm());

      // Make some changes
      act(() => {
        result.current.setDate('2026-01-20');
        result.current.setEntranceTime('08:00');
        result.current.addProjectReport();
      });

      expect(result.current.formData.date).toBe('2026-01-20');
      expect(result.current.formData.projectReports).toHaveLength(1);

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.date).toBe('2026-01-21');
      expect(result.current.formData.entranceTime).toBe('09:00');
      expect(result.current.formData.projectReports).toHaveLength(0);
    });

    it('clears all errors', () => {
      const { result } = renderHook(() => useDailyReportForm());

      // Trigger validation to set errors
      act(() => {
        result.current.validateForm();
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      // Clear errors
      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  // ============================================================================
  // Project Report Handler Tests
  // ============================================================================

  describe('project report handlers', () => {
    it('adds a new empty project report', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
      });

      expect(result.current.formData.projectReports).toHaveLength(1);
      expect(result.current.formData.projectReports[0]).toMatchObject({
        clientId: '',
        projectId: '',
        taskId: '',
        location: 'office',
        reportingType: 'duration',
      });
    });

    it('adds multiple project reports', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        result.current.addProjectReport();
        result.current.addProjectReport();
      });

      expect(result.current.formData.projectReports).toHaveLength(3);
    });

    it('updates project report at specific index', () => {
      const { result } = renderHook(() => useDailyReportForm());

      // Add two reports
      act(() => {
        result.current.addProjectReport();
        result.current.addProjectReport();
      });

      // Update second report
      act(() => {
        result.current.updateProjectReport(1, {
          taskId: 'task-1',
          taskName: 'Task 1',
          duration: 240,
        });
      });

      expect(result.current.formData.projectReports[1].taskId).toBe('task-1');
      expect(result.current.formData.projectReports[1].taskName).toBe('Task 1');
      expect(result.current.formData.projectReports[1].duration).toBe(240);

      // First report should remain unchanged
      expect(result.current.formData.projectReports[0].taskId).toBe('');
    });

    it('updates project report partially', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
      });

      // Update only location
      act(() => {
        result.current.updateProjectReport(0, { location: 'home' });
      });

      expect(result.current.formData.projectReports[0].location).toBe('home');
      expect(result.current.formData.projectReports[0].taskId).toBe(''); // Unchanged
    });

    it('removes project report at specific index', () => {
      const { result } = renderHook(() => useDailyReportForm());

      // Add three reports
      act(() => {
        result.current.addProjectReport();
        result.current.addProjectReport();
        result.current.addProjectReport();
        result.current.updateProjectReport(0, { taskId: 'task-1' });
        result.current.updateProjectReport(1, { taskId: 'task-2' });
        result.current.updateProjectReport(2, { taskId: 'task-3' });
      });

      expect(result.current.formData.projectReports).toHaveLength(3);

      // Remove middle report
      act(() => {
        result.current.removeProjectReport(1);
      });

      expect(result.current.formData.projectReports).toHaveLength(2);
      expect(result.current.formData.projectReports[0].taskId).toBe('task-1');
      expect(result.current.formData.projectReports[1].taskId).toBe('task-3');
    });

    it('clears errors when updating project report', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
      });

      // Trigger validation to set errors
      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.projectReports).toBeDefined();

      // Update should clear errors for that report
      act(() => {
        result.current.updateProjectReport(0, {
          projectId: 'project-1',
          taskId: 'task-1',
        });
      });

      expect(result.current.errors.projectReports).toEqual({});
    });
  });

  // ============================================================================
  // Progress Calculation Tests
  // ============================================================================

  describe('progress calculation', () => {
    it('calculates progress correctly with duration-based reports', () => {
      const { result } = renderHook(() => useDailyReportForm());

      // Target: 09:00 - 17:00 = 8 hours = 480 minutes
      act(() => {
        result.current.addProjectReport();
        result.current.updateProjectReport(0, { duration: 240 }); // 4 hours
      });

      expect(result.current.progress.totalDuration).toBe(240);
      expect(result.current.progress.targetDuration).toBe(480);
      expect(result.current.progress.percentage).toBe(50);
      expect(result.current.progress.isComplete).toBe(false);
      expect(result.current.progress.missingTime).toBe(240);
    });

    it('calculates progress correctly with startEnd-based reports', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        result.current.updateProjectReport(0, {
          reportingType: 'startEnd',
          startTime: '09:00',
          endTime: '13:00', // 4 hours
        });
      });

      expect(result.current.progress.totalDuration).toBe(240);
      expect(result.current.progress.targetDuration).toBe(480);
      expect(result.current.progress.percentage).toBe(50);
    });

    it('calculates progress with multiple reports', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        result.current.addProjectReport();
        result.current.updateProjectReport(0, { duration: 180 }); // 3 hours
        result.current.updateProjectReport(1, { duration: 120 }); // 2 hours
      });

      expect(result.current.progress.totalDuration).toBe(300); // 5 hours
      expect(result.current.progress.percentage).toBe(63); // 300/480 rounded
    });

    it('shows complete when total >= target', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        result.current.updateProjectReport(0, { duration: 480 }); // Exactly 8 hours
      });

      expect(result.current.progress.isComplete).toBe(true);
      expect(result.current.progress.missingTime).toBe(0);
    });

    it('updates progress when entrance/exit times change', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        result.current.updateProjectReport(0, { duration: 240 });
      });

      expect(result.current.progress.targetDuration).toBe(480);

      // Change to shorter workday
      act(() => {
        result.current.setExitTime('13:00'); // 09:00 - 13:00 = 4 hours
      });

      expect(result.current.progress.targetDuration).toBe(240);
      expect(result.current.progress.isComplete).toBe(true); // Now complete
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe('validation', () => {
    it('validates missing project reports', () => {
      const { result } = renderHook(() => useDailyReportForm());

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.general).toBe('יש להוסיף לפחות דיווח פרויקט אחד');
    });

    it('validates invalid date format', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.setDate('invalid-date');
        result.current.addProjectReport();
        result.current.updateProjectReport(0, {
          projectId: 'p1',
          taskId: 't1',
          location: 'office',
          duration: 240,
        });
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.date).toBeDefined();
    });

    it('validates future date', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.setDate('2027-01-01');
        result.current.addProjectReport();
        result.current.updateProjectReport(0, {
          projectId: 'p1',
          taskId: 't1',
          location: 'office',
          duration: 240,
        });
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.date).toContain('future');
    });

    it('validates invalid time format', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.setEntranceTime('25:00'); // Invalid hour
        result.current.addProjectReport();
        result.current.updateProjectReport(0, {
          projectId: 'p1',
          taskId: 't1',
          location: 'office',
          duration: 240,
        });
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.entranceTime).toBeDefined();
    });

    it('validates exit time before entrance time', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.setEntranceTime('17:00');
        result.current.setExitTime('09:00');
        result.current.addProjectReport();
        result.current.updateProjectReport(0, {
          projectId: 'p1',
          taskId: 't1',
          location: 'office',
          duration: 240,
        });
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.exitTime).toContain('after');
    });

    it('validates project report missing required fields', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        // Don't set any fields - all should be invalid
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.projectReports).toBeDefined();
      expect(result.current.errors.projectReports![0]).toBeDefined();
    });

    it('validates multiple project reports independently', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        result.current.addProjectReport();

        // First report is complete
        result.current.updateProjectReport(0, {
          projectId: 'p1',
          taskId: 't1',
          location: 'office',
          duration: 240,
        });

        // Second report is incomplete
        result.current.updateProjectReport(1, {
          projectId: 'p2',
          // Missing taskId, location, duration
        });
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.projectReports![0]).toBeUndefined();
      expect(result.current.errors.projectReports![1]).toBeDefined();
    });

    it('returns true for valid form', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        result.current.updateProjectReport(0, {
          projectId: 'p1',
          taskId: 't1',
          location: 'office',
          duration: 480,
        });
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });
  });

  // ============================================================================
  // isValid Computed Property Tests
  // ============================================================================

  describe('isValid computed property', () => {
    it('returns false when no project reports', () => {
      const { result } = renderHook(() => useDailyReportForm());

      expect(result.current.isValid).toBe(false);
    });

    it('returns false when project reports incomplete', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        // Don't set required fields
      });

      expect(result.current.isValid).toBe(false);
    });

    it('returns true when all fields valid', () => {
      const { result } = renderHook(() => useDailyReportForm());

      act(() => {
        result.current.addProjectReport();
        result.current.updateProjectReport(0, {
          projectId: 'p1',
          taskId: 't1',
          location: 'office',
          duration: 480,
        });
      });

      expect(result.current.isValid).toBe(true);
    });

    it('updates reactively when form changes', () => {
      const { result } = renderHook(() => useDailyReportForm());

      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.addProjectReport();
      });

      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.updateProjectReport(0, {
          projectId: 'p1',
          taskId: 't1',
          location: 'office',
          duration: 480,
        });
      });

      expect(result.current.isValid).toBe(true);
    });
  });
});
