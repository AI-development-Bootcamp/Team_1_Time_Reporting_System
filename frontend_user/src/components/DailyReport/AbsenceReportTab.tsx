/**
 * AbsenceReportTab Component
 * Form for creating absence reports (sickness, reserves, dayOff, halfDayOff)
 * 
 * Features:
 * - Date selection
 * - Absence type dropdown (sickness, reserves, dayOff, halfDayOff)
 * - File upload for documentation (sickness/reserves)
 * - Multi-day absence reporting
 * - Simple save (no validation required)
 * - Mobile-first, RTL design
 */

import { useState } from 'react';
import { TextInput, Select, Button, Stack, Text, Loader } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { createAbsenceAttendance } from '../../services/attendanceApi';
import { AbsenceType, CreateAbsenceAttendanceRequest } from '../../types';
import { QUERY_KEYS } from '../../utils/constants';
import classes from './AbsenceReportTab.module.css';

interface AbsenceReportTabProps {
  /** Mode: create new report or edit existing */
  mode?: 'create' | 'edit';
  /** Existing attendance ID (for edit mode) */
  existingAttendanceId?: string;
  /** Default date to pre-fill (YYYY-MM-DD) */
  defaultDate?: string;
  /** Callback when report is successfully saved */
  onSuccess?: () => void;
}

// Absence type options with Hebrew labels
const ABSENCE_TYPE_OPTIONS = [
  { value: 'sickness', label: 'מחלה 😷' },
  { value: 'reserves', label: 'מילואים 🪖' },
  { value: 'halfDayOff', label: 'חופשה - חצי יום' },
  { value: 'dayOff', label: 'חופשה - יום מלא' },
];

/**
 * AbsenceReportTab - Form for reporting absences
 * 
 * @example
 * <AbsenceReportTab
 *   mode="create"
 *   defaultDate="2026-01-21"
 *   onSuccess={() => closeModal()}
 * />
 */
export function AbsenceReportTab({
  mode = 'create',
  existingAttendanceId: _existingAttendanceId,
  defaultDate,
  onSuccess,
}: AbsenceReportTabProps) {
  const queryClient = useQueryClient();

  // Form state
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [absenceType, setAbsenceType] = useState<AbsenceType>('sickness');
  const [isMultiDay, setIsMultiDay] = useState(false);

  // Mutation for creating absence attendance
  const { mutateAsync: createAbsence, isPending } = useMutation({
    mutationFn: (data: CreateAbsenceAttendanceRequest) => createAbsenceAttendance(data),
    onSuccess: () => {
      // Invalidate month history to refresh the calendar
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.monthHistory] });

      // Show success notification
      notifications.show({
        title: 'הצלחה',
        message: 'הדיווח נשמר בהצלחה',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      // Show error notification
      notifications.show({
        title: 'שגיאה',
        message: error?.response?.data?.message || 'שגיאה בשמירת הדיווח',
        color: 'red',
        autoClose: 5000,
      });
    },
  });

  // Handle save
  const handleSave = async () => {
    // TODO: Implement edit mode logic
    if (mode === 'edit') {
      notifications.show({
        title: 'מידע',
        message: 'מצב עריכה יתווסף בעדכון הבא',
        color: 'blue',
        autoClose: 3000,
      });
      return;
    }

    // Create absence report
    // TODO: Get userId from auth context
    const userId = 'temp-user-id';

    try {
      await createAbsence({
        userId,
        date,
        status: absenceType,
        startTime: null,
        endTime: null,
      });

      // Call success callback
      onSuccess?.();
    } catch (error) {
      // Error is already handled by mutation
      console.error('Failed to create absence report:', error);
    }
  };

  // Check if document upload is needed
  const needsDocument = absenceType === 'sickness' || absenceType === 'reserves';

  return (
    <div className={classes.container}>
      <Stack gap="lg">
        {/* Date Selector */}
        <div className={classes.section}>
          <Text className={classes.label} size="sm" fw={500} mb="xs">
            תאריך
          </Text>
          <TextInput
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
            placeholder="YYYY-MM-DD"
            className={classes.input}
            dir="ltr"
            // TODO: Replace with DatePickerModal (same as WorkReportTab)
            // onClick={() => openDatePicker()}
          />
          <Text size="xs" c="dimmed" mt="xs">
            TODO: Replace with DatePickerModal (future task)
          </Text>
        </div>

        {/* Absence Type Dropdown */}
        <div className={classes.section}>
          <Text className={classes.label} size="sm" fw={500} mb="xs">
            סוג היעדרות
          </Text>
          <Select
            value={absenceType}
            onChange={(value) => setAbsenceType(value as AbsenceType)}
            data={ABSENCE_TYPE_OPTIONS}
            className={classes.select}
            allowDeselect={false}
          />
        </div>

        {/* File Upload (for sickness/reserves) */}
        {needsDocument && (
          <div className={classes.section}>
            <Text className={classes.label} size="sm" fw={500} mb="xs">
              העלאת אישור
            </Text>
            <div className={classes.fileUploadPlaceholder}>
              <Text size="sm" c="dimmed" ta="center">
                📁 FileUpload component
              </Text>
              <Text size="xs" c="dimmed" ta="center" mt="xs">
                TODO: Replace with FileUpload component (TASK-M2-020-FE-018)
              </Text>
            </div>
          </div>
        )}

        {/* Multi-Day Absence Button */}
        <div className={classes.section}>
          <Button
            variant="light"
            onClick={() => {
              setIsMultiDay(!isMultiDay);
              // TODO: Open DateRangePickerModal (future task)
              alert('DateRangePickerModal - Coming soon');
            }}
            className={classes.multiDayButton}
          >
            {isMultiDay ? '✓ ' : ''}לדווח על היעדרות יותר מיום אחד
          </Button>
          {isMultiDay && (
            <Text size="xs" c="dimmed" mt="xs">
              TODO: Replace with DateRangePickerModal (future task)
            </Text>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isPending}
          size="lg"
          className={classes.saveButton}
        >
          {isPending ? (
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
            <pre>{JSON.stringify({ date, absenceType, isMultiDay }, null, 2)}</pre>
          </details>
        )}
      </Stack>
    </div>
  );
}
