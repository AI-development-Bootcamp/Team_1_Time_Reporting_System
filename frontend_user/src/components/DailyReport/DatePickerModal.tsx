/**
 * DatePickerModal Component
 * Calendar picker for selecting dates
 * 
 * Features:
 * - Calendar view with month/year navigation
 * - Hebrew day names and month names
 * - Highlight selected date
 * - Disable future dates (can't report future work)
 * - Mobile-first, RTL design
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Group, Stack, Text, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { HEBREW_DAY_NAMES_SHORT, HEBREW_MONTH_NAMES } from '../../utils/constants';
import classes from './DatePickerModal.module.css';

interface DatePickerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Current value in YYYY-MM-DD format */
  value?: string;
  /** Callback when date is changed */
  onChange: (date: string) => void;
}

/**
 * DatePickerModal - Calendar date picker
 * 
 * @example
 * <DatePickerModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   value="2026-01-21"
 *   onChange={(date) => setDate(date)}
 * />
 */
export function DatePickerModal({
  isOpen,
  onClose,
  value,
  onChange,
}: DatePickerModalProps) {
  // Parse initial value or default to today
  const parseDate = (dateStr?: string): dayjs.Dayjs => {
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dayjs();
    }
    return dayjs(dateStr);
  };

  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(parseDate(value));
  const [viewDate, setViewDate] = useState<dayjs.Dayjs>(parseDate(value));
  const today = dayjs();

  // Update selection when value prop changes
  useEffect(() => {
    if (isOpen && value) {
      const parsed = parseDate(value);
      setSelectedDate(parsed);
      setViewDate(parsed);
    }
  }, [isOpen, value]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    setViewDate(viewDate.subtract(1, 'month'));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setViewDate(viewDate.add(1, 'month'));
  };

  // Handle date selection
  const handleDateClick = (date: dayjs.Dayjs) => {
    // Don't allow selecting future dates
    if (date.isAfter(today, 'day')) {
      return;
    }
    setSelectedDate(date);
  };

  // Save selected date
  const handleSave = () => {
    onChange(selectedDate.format('YYYY-MM-DD'));
    onClose();
  };

  // Clear date
  const handleClear = () => {
    onChange('');
    onClose();
  };

  // Cancel (reset to original value)
  const handleCancel = () => {
    if (value) {
      const parsed = parseDate(value);
      setSelectedDate(parsed);
      setViewDate(parsed);
    }
    onClose();
  };

  // Generate calendar grid
  const generateCalendar = (): (dayjs.Dayjs | null)[] => {
    const firstDayOfMonth = viewDate.startOf('month');
    const startDayOfWeek = firstDayOfMonth.day(); // 0 = Sunday
    const daysInMonth = viewDate.daysInMonth();

    const calendar: (dayjs.Dayjs | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(firstDayOfMonth.date(day));
    }

    return calendar;
  };

  const calendarDays = generateCalendar();
  const monthYearLabel = `${HEBREW_MONTH_NAMES[viewDate.month()]} ${viewDate.year()}`;

  return (
    <Modal
      opened={isOpen}
      onClose={handleCancel}
      centered
      size="sm"
      withCloseButton={false}
      classNames={{
        root: classes.modalRoot,
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      <Stack gap="md">
        {/* Month/Year Header with Navigation */}
        <div className={classes.header}>
          <ActionIcon
            variant="subtle"
            onClick={handlePrevMonth}
            size="lg"
            className={classes.navButton}
          >
            <IconChevronRight size={20} />
          </ActionIcon>

          <Text size="lg" fw={600} ta="center">
            {monthYearLabel}
          </Text>

          <ActionIcon
            variant="subtle"
            onClick={handleNextMonth}
            size="lg"
            className={classes.navButton}
          >
            <IconChevronLeft size={20} />
          </ActionIcon>
        </div>

        {/* Day Names Header */}
        <div className={classes.dayNamesGrid}>
          {Object.values(HEBREW_DAY_NAMES_SHORT).map((dayName, index) => (
            <div key={index} className={classes.dayName}>
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={classes.calendarGrid}>
          {calendarDays.map((date, index) => {
            if (!date) {
              // Empty cell
              return <div key={`empty-${index}`} className={classes.emptyCell} />;
            }

            const isSelected = date.isSame(selectedDate, 'day');
            const isToday = date.isSame(today, 'day');
            const isFuture = date.isAfter(today, 'day');
            const isCurrentMonth = date.month() === viewDate.month();

            return (
              <div
                key={date.format('YYYY-MM-DD')}
                className={`${classes.dateCell} ${
                  isSelected ? classes.selected : ''
                } ${isToday ? classes.today : ''} ${
                  isFuture ? classes.disabled : ''
                } ${!isCurrentMonth ? classes.otherMonth : ''}`}
                onClick={() => handleDateClick(date)}
              >
                {date.date()}
              </div>
            );
          })}
        </div>

        {/* Selected Date Display */}
        {selectedDate && (
          <div className={classes.display}>
            <Text size="md" fw={600} ta="center" c="blue">
              {selectedDate.format('DD/MM/YYYY')}
            </Text>
          </div>
        )}

        {/* Action Buttons */}
        <Group grow>
          <Button variant="outline" onClick={handleClear}>
            נקה
          </Button>
          <Button onClick={handleSave}>
            שמירה
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
