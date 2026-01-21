/**
 * TimePickerModal Component
 * Scrollable time picker for selecting hours and minutes
 * 
 * Features:
 * - Hours: 00-23
 * - Minutes: 00-59 in 5-minute increments
 * - Mobile-first, RTL design
 * - Save and Clear buttons
 */

import { useState, useEffect, useRef } from 'react';
import { Modal, Button, Group, Stack, Text } from '@mantine/core';
import classes from './TimePickerModal.module.css';

interface TimePickerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Current value in HH:mm format */
  value?: string;
  /** Callback when time is changed */
  onChange: (time: string) => void;
  /** Label for the picker */
  label?: string;
}

// Generate hours array (00-23)
const HOURS = Array.from({ length: 24 }, (_, i) => 
  i.toString().padStart(2, '0')
);

// Generate minutes array in 5-minute increments (00, 05, 10, ..., 55)
const MINUTES = Array.from({ length: 12 }, (_, i) => 
  (i * 5).toString().padStart(2, '0')
);

/**
 * TimePickerModal - Scrollable time picker
 * 
 * @example
 * <TimePickerModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   value="09:00"
 *   onChange={(time) => setTime(time)}
 *   label="בחר שעת כניסה"
 * />
 */
export function TimePickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  label = 'בחר שעה',
}: TimePickerModalProps) {
  // Parse initial value
  const parseTime = (timeStr?: string): { hour: string; minute: string } => {
    if (!timeStr || !timeStr.match(/^\d{2}:\d{2}$/)) {
      return { hour: '09', minute: '00' };
    }
    const [hour, minute] = timeStr.split(':');
    // Round minute to nearest 5-minute increment
    const minuteNum = parseInt(minute);
    const roundedMinute = (Math.round(minuteNum / 5) * 5).toString().padStart(2, '0');
    return { hour, minute: roundedMinute };
  };

  const initialTime = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(initialTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialTime.minute);

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  // Update selection when value prop changes
  useEffect(() => {
    if (isOpen && value) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
    }
  }, [isOpen, value]);

  // Scroll to selected item when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToSelected();
      }, 100);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  const scrollToSelected = () => {
    if (hourScrollRef.current) {
      const hourIndex = HOURS.indexOf(selectedHour);
      const hourItem = hourScrollRef.current.children[hourIndex] as HTMLElement;
      if (hourItem) {
        hourItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }

    if (minuteScrollRef.current) {
      const minuteIndex = MINUTES.indexOf(selectedMinute);
      const minuteItem = minuteScrollRef.current.children[minuteIndex] as HTMLElement;
      if (minuteItem) {
        minuteItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  };

  const handleSave = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  const handleClear = () => {
    onChange('');
    onClose();
  };

  const handleCancel = () => {
    // Reset to original value
    if (value) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
    }
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={handleCancel}
      centered
      size="xs"
      withCloseButton={false}
      classNames={{
        root: classes.modalRoot,
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      <Stack gap="md">
        {/* Label */}
        <Text size="lg" fw={600} ta="center">
          {label}
        </Text>

        {/* Time Picker */}
        <div className={classes.pickerContainer}>
          {/* Hours Column */}
          <div className={classes.column}>
            <Text size="sm" c="dimmed" ta="center" mb="xs">
              שעות
            </Text>
            <div className={classes.scrollContainer} ref={hourScrollRef}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className={`${classes.item} ${
                    hour === selectedHour ? classes.selected : ''
                  }`}
                  onClick={() => setSelectedHour(hour)}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className={classes.separator}>:</div>

          {/* Minutes Column */}
          <div className={classes.column}>
            <Text size="sm" c="dimmed" ta="center" mb="xs">
              דקות
            </Text>
            <div className={classes.scrollContainer} ref={minuteScrollRef}>
              {MINUTES.map((minute) => (
                <div
                  key={minute}
                  className={`${classes.item} ${
                    minute === selectedMinute ? classes.selected : ''
                  }`}
                  onClick={() => setSelectedMinute(minute)}
                >
                  {minute}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Selection Display */}
        <div className={classes.display}>
          <Text size="xl" fw={700} ta="center" c="blue">
            {selectedHour}:{selectedMinute}
          </Text>
        </div>

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
