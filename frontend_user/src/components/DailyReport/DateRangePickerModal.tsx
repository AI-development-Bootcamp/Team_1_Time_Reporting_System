/**
 * DateRangePickerModal Component
 * Modal for selecting a date range for multi-day absence reporting
 * 
 * Features:
 * - Start and end date selection
 * - Each date opens DatePickerModal
 * - Calculate and display total days
 * - Validate: endDate >= startDate
 * - Save and clear buttons
 * - Mobile-first, RTL design
 */

import { useState, useEffect } from 'react';
import { Modal, Button, TextInput, Stack, Text, Group } from '@mantine/core';
import dayjs from 'dayjs';
import { DatePickerModal } from './DatePickerModal';
import classes from './DateRangePickerModal.module.css';

interface DateRangePickerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when date range is saved (startDate, endDate, totalDays) */
  onSave: (startDate: string, endDate: string, totalDays: number) => void;
}

/**
 * Calculate number of days between two dates (inclusive)
 */
function calculateTotalDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  if (!start.isValid() || !end.isValid()) return 0;
  
  // Add 1 to include both start and end dates
  const days = end.diff(start, 'day') + 1;
  return days > 0 ? days : 0;
}

/**
 * DateRangePickerModal - Modal for selecting a date range
 * 
 * @example
 * <DateRangePickerModal
 *   isOpen={isRangeModalOpen}
 *   onClose={() => setIsRangeModalOpen(false)}
 *   onSave={(start, end, days) => {
 *     console.log(`Selected ${days} days from ${start} to ${end}`);
 *     setIsRangeModalOpen(false);
 *   }}
 * />
 */
export function DateRangePickerModal({
  isOpen,
  onClose,
  onSave,
}: DateRangePickerModalProps) {
  // Date states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal states for DatePickerModal
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

  // Calculate total days
  const totalDays = calculateTotalDays(startDate, endDate);

  // Validation
  const isValid = startDate && endDate && totalDays > 0;
  const hasError = startDate && endDate && totalDays === 0;

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStartDate('');
      setEndDate('');
    }
  }, [isOpen]);

  // Handle save
  const handleSave = () => {
    if (!isValid) return;
    onSave(startDate, endDate, totalDays);
  };

  // Handle clear
  const handleClear = () => {
    setStartDate('');
    setEndDate('');
  };

  // Format date for display (DD/MM/YYYY)
  const formatDateDisplay = (date: string): string => {
    if (!date) return '';
    const parsed = dayjs(date);
    if (!parsed.isValid()) return date;
    return parsed.format('DD/MM/YYYY');
  };

  return (
    <>
      <Modal
        opened={isOpen}
        onClose={onClose}
        title="דיווח היעדרות לפי טווח"
        size="md"
        centered
        classNames={{
          title: classes.modalTitle,
          header: classes.modalHeader,
          body: classes.modalBody,
        }}
      >
        <Stack gap="lg">
          {/* Start Date Field */}
          <div className={classes.dateField}>
            <Text className={classes.label} size="sm" fw={500} mb="xs">
              תאריך התחלה
            </Text>
            <TextInput
              value={formatDateDisplay(startDate)}
              placeholder="בחר תאריך"
              readOnly
              onClick={() => setIsStartPickerOpen(true)}
              className={classes.input}
              dir="ltr"
              styles={{
                input: {
                  cursor: 'pointer',
                  textAlign: 'center',
                },
              }}
            />
          </div>

          {/* End Date Field */}
          <div className={classes.dateField}>
            <Text className={classes.label} size="sm" fw={500} mb="xs">
              תאריך סיום
            </Text>
            <TextInput
              value={formatDateDisplay(endDate)}
              placeholder="בחר תאריך"
              readOnly
              onClick={() => setIsEndPickerOpen(true)}
              className={classes.input}
              dir="ltr"
              styles={{
                input: {
                  cursor: 'pointer',
                  textAlign: 'center',
                },
              }}
            />
          </div>

          {/* Total Days Display */}
          {isValid && (
            <div className={classes.totalDays}>
              <Text size="md" fw={600} c="blue" ta="center">
                סה"כ ימי דיווח: {totalDays} ימים
              </Text>
            </div>
          )}

          {/* Error Message */}
          {hasError && (
            <div className={classes.errorMessage}>
              <Text size="sm" c="red" ta="center">
                תאריך הסיום חייב להיות שווה או מאוחר מתאריך ההתחלה
              </Text>
            </div>
          )}

          {/* Action Buttons */}
          <Group gap="sm" mt="md">
            <Button
              onClick={handleSave}
              disabled={!isValid}
              size="lg"
              className={classes.saveButton}
              flex={1}
            >
              שמירה
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="lg"
              className={classes.clearButton}
              flex={1}
            >
              נקה
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* DatePickerModal for Start Date */}
      <DatePickerModal
        isOpen={isStartPickerOpen}
        onClose={() => setIsStartPickerOpen(false)}
        value={startDate}
        onChange={(date) => {
          setStartDate(date);
          setIsStartPickerOpen(false);
        }}
      />

      {/* DatePickerModal for End Date */}
      <DatePickerModal
        isOpen={isEndPickerOpen}
        onClose={() => setIsEndPickerOpen(false)}
        value={endDate}
        onChange={(date) => {
          setEndDate(date);
          setIsEndPickerOpen(false);
        }}
      />
    </>
  );
}
