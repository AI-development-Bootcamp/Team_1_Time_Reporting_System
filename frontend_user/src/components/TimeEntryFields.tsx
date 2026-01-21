import React from 'react';
import { Stack } from '@mantine/core';
import TimePickerField from './TimePickerField';

interface TimeEntryFieldsProps {
  entryTime: string;
  exitTime: string;
  onEntryTimeChange: (time: string) => void;
  onExitTimeChange: (time: string) => void;
}

const TimeEntryFields: React.FC<TimeEntryFieldsProps> = ({
  entryTime,
  exitTime,
  onEntryTimeChange,
  onExitTimeChange,
}) => {
  return (
    <Stack gap="md" mt="lg">
      <TimePickerField label="כניסה" value={entryTime} onChange={onEntryTimeChange} />
      <TimePickerField label="יציאה" value={exitTime} onChange={onExitTimeChange} />
    </Stack>
  );
};

export default TimeEntryFields;

