/**
 * WorkReportTab Component
 * Form for creating/editing daily work attendance reports
 * 
 * Features:
 * - Date selection
 * - Entrance/Exit time inputs
 * - Project reports list
 * - Progress tracker
 * - Form validation and submission
 */

import { useState } from 'react';
import { TextInput, Button, Stack, Group, Text, Loader } from '@mantine/core';
import { useDailyReportForm } from '../../hooks/useDailyReportForm';
import { useCreateDailyReport } from '../../hooks/useCreateDailyReport';
import { IncompleteHoursModal } from './IncompleteHoursModal';
import { formatDurationHours } from '../../utils/dateUtils';
import { showMissingFieldsError, showSaveSuccess, showError } from '../../utils/toast';
import classes from './WorkReportTab.module.css';

interface WorkReportTabProps {
  /** Mode: create new report or edit existing */
  mode?: 'create' | 'edit';
  /** Existing attendance ID (for edit mode) */
  existingAttendanceId?: string;
  /** Default date to pre-fill (YYYY-MM-DD) */
  defaultDate?: string;
  /** Callback when report is successfully saved */
  onSuccess?: () => void;
}

/**
 * WorkReportTab - Form for daily work attendance
 * 
 * @example
 * <WorkReportTab
 *   mode="create"
 *   defaultDate="2026-01-21"
 *   onSuccess={() => closeModal()}
 * />
 */
export function WorkReportTab({
  mode = 'create',
  existingAttendanceId: _existingAttendanceId,
  defaultDate,
  onSuccess,
}: WorkReportTabProps) {
  // Form state management
  const {
    formData,
    setDate,
    setEntranceTime,
    setExitTime,
    addProjectReport,
    progress,
    errors,
    isValid,
    validateForm,
  } = useDailyReportForm({
    initialData: defaultDate ? { date: defaultDate } : undefined,
    mode,
  });

  // Mutation for creating report
  const { mutateAsync: createReport, isLoading } = useCreateDailyReport();

  // Modal state for incomplete hours warning
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  // Handle save with complete validation flow
  const handleSave = async () => {
    // Step 1: Run validation
    const validationResult = validateForm();
    
    if (!validationResult) {
      // Show appropriate error toast based on validation type
      // Check for missing required fields
      if (errors.date || errors.entranceTime || errors.exitTime || formData.projectReports.length === 0) {
        showMissingFieldsError();
        return;
      }
      
      // For any other validation errors
      if (errors.general) {
        showError(errors.general);
        return;
      }
      
      return;
    }

    // Step 2: Check if tracker is complete (< 100%)
    if (!progress.isComplete && progress.missingTime > 0) {
      // Show IncompleteHoursModal
      setShowIncompleteModal(true);
      return;
    }

    // Step 3: If all validations pass, proceed with save
    await performSave();
  };

  // Perform the actual save operation
  const performSave = async () => {
    // TODO: Implement edit mode logic
    if (mode === 'edit') {
      showError('מצב עריכה יתווסף בעדכון הבא');
      return;
    }

    // Create report
    // TODO: Get userId from auth context
    const userId = 'temp-user-id';

    try {
      // Call createCombinedAttendance mutation
      await createReport({
        userId,
        date: formData.date,
        startTime: formData.entranceTime,
        endTime: formData.exitTime,
        status: 'work',
        timeLogs: formData.projectReports.map((report) => ({
          taskId: report.taskId,
          duration: report.duration,
          startTime: report.startTime,
          endTime: report.endTime,
          location: report.location,
          description: report.description,
        })),
      });

      // Show success toast
      showSaveSuccess();

      // Call success callback (closes modal and refreshes data)
      onSuccess?.();
    } catch (error: any) {
      // Show error toast with error message
      const errorMessage = error?.message || 'שגיאה בשמירת הדיווח';
      showError(errorMessage);
      console.error('Failed to create report:', error);
    }
  };

  // Handle confirm from IncompleteHoursModal
  const handleConfirmIncomplete = () => {
    setShowIncompleteModal(false);
    performSave();
  };

  return (
    <div className={classes.container}>
      <Stack gap="lg">
        {/* Date Selector */}
        <div className={classes.section}>
          <Text className={classes.label} size="sm" fw={500} mb="xs">
            תאריך
          </Text>
          <TextInput
            value={formData.date}
            onChange={(e) => setDate(e.currentTarget.value)}
            placeholder="YYYY-MM-DD"
            error={errors.date}
            className={classes.input}
            dir="ltr"
            // TODO: Replace with DatePickerModal
            // onClick={() => openDatePicker()}
          />
          <Text size="xs" c="dimmed" mt="xs">
            TODO: Replace with DatePickerModal (future task)
          </Text>
        </div>

        {/* Time Inputs */}
        <div className={classes.section}>
          <Group grow>
            <div>
              <Text className={classes.label} size="sm" fw={500} mb="xs">
                כניסה
              </Text>
              <TextInput
                value={formData.entranceTime}
                onChange={(e) => setEntranceTime(e.currentTarget.value)}
                placeholder="HH:mm"
                error={errors.entranceTime}
                className={classes.input}
                dir="ltr"
                // TODO: Replace with TimePickerModal
                // onClick={() => openTimePicker('entrance')}
              />
            </div>
            <div>
              <Text className={classes.label} size="sm" fw={500} mb="xs">
                יציאה
              </Text>
              <TextInput
                value={formData.exitTime}
                onChange={(e) => setExitTime(e.currentTarget.value)}
                placeholder="HH:mm"
                error={errors.exitTime}
                className={classes.input}
                dir="ltr"
                // TODO: Replace with TimePickerModal
                // onClick={() => openTimePicker('exit')}
              />
            </div>
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            TODO: Replace with TimePickerModal (future task)
          </Text>
        </div>

        {/* Add Project Report Button */}
        <Button
          variant="light"
          onClick={addProjectReport}
          className={classes.addButton}
        >
          + הוסף דיווח פרויקט
        </Button>

        {/* Project Reports List */}
        <div className={classes.section}>
          <Text className={classes.label} size="sm" fw={500} mb="md">
            דיווחי פרויקטים ({formData.projectReports.length})
          </Text>
          {formData.projectReports.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              לחץ על "הוסף דיווח פרויקט" להתחיל
            </Text>
          ) : (
            <div className={classes.projectsList}>
              {formData.projectReports.map((report, index) => (
                <div key={index} className={classes.projectItem}>
                  <Text size="sm">
                    פרויקט #{index + 1} - {report.taskId || 'לא נבחר'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    משך: {report.duration || 0} דקות
                  </Text>
                </div>
              ))}
            </div>
          )}
          <Text size="xs" c="dimmed" mt="xs">
            TODO: Replace with ProjectReportsList component (TASK-M2-020-FE-013)
          </Text>
        </div>

        {/* Progress Tracker */}
        <div className={classes.section}>
          <Text className={classes.label} size="sm" fw={500} mb="md">
            התקדמות
          </Text>
          <div className={classes.progressContainer}>
            <Group justify="space-between" mb="xs">
              <Text size="sm">
                {formatDurationHours(progress.totalDuration)} / {formatDurationHours(progress.targetDuration)} שעות
              </Text>
              <Text size="sm" fw={600} c={progress.isComplete ? 'green' : 'orange'}>
                {progress.percentage}%
              </Text>
            </Group>
            <div className={classes.progressBar}>
              <div
                className={classes.progressFill}
                style={{
                  width: `${Math.min(progress.percentage, 100)}%`,
                  backgroundColor: progress.isComplete ? '#51cf66' : '#ffa94d',
                }}
              />
            </div>
            {!progress.isComplete && progress.missingTime > 0 && (
              <Text size="xs" c="dimmed" mt="xs">
                חסרים {formatDurationHours(progress.missingTime)} שעות
              </Text>
            )}
          </div>
          <Text size="xs" c="dimmed" mt="xs">
            TODO: Replace with ProgressTracker component (TASK-M2-020-FE-014)
          </Text>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!isValid || isLoading}
          size="lg"
          className={classes.saveButton}
        >
          {isLoading ? (
            <>
              <Loader size="sm" color="white" mr="xs" />
              שומר...
            </>
          ) : (
            'שמור'
          )}
        </Button>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className={classes.debug}>
            <summary>Debug Info</summary>
            <pre>{JSON.stringify({ formData, progress, errors, isValid }, null, 2)}</pre>
          </details>
        )}
      </Stack>

      {/* Incomplete Hours Modal */}
      <IncompleteHoursModal
        isOpen={showIncompleteModal}
        onClose={() => setShowIncompleteModal(false)}
        onConfirm={handleConfirmIncomplete}
        missingHours={progress.missingTime}
      />
    </div>
  );
}
