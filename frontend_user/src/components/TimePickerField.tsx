import React, { useMemo, useState } from 'react';
import { Popover, Box, Text, Group, ScrollArea, Stack, Button } from '@mantine/core';
import styles from './TimePickerField.module.css';

interface TimePickerFieldProps {
  label: string;
  value: string; // format "HH:mm"
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const TimePickerField: React.FC<TimePickerFieldProps> = ({ label, value, onChange }) => {
  const [opened, setOpened] = useState(false);

  const [tempHour, tempMinute] = useMemo(() => {
    const [h, m] = value.split(':');
    return [h ?? '00', m ?? '00'];
  }, [value]);

  const [selectedHour, setSelectedHour] = useState(tempHour);
  const [selectedMinute, setSelectedMinute] = useState(tempMinute);

  const displayValue = `${value || `${selectedHour}:${selectedMinute}`}`;

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    setOpened(false);
  };

  const handleOpen = () => {
    setSelectedHour(tempHour);
    setSelectedMinute(tempMinute);
    setOpened(true);
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom"
      width="target"
      shadow="md"
      radius="md"
    >
      <Popover.Target>
        <Box onClick={handleOpen} className={styles.fieldRoot}>
          <Text className={styles.fieldValue}>{displayValue}</Text>
          <Text className={styles.fieldLabel}>
            {label}
          </Text>
        </Box>
      </Popover.Target>

      <Popover.Dropdown>
        <Stack gap="sm">
          <Group justify="center" gap="xl" className={styles.pickerGroup}>
            {/* Highlight band */}
            <Box className={styles.highlightBand} />

            <ScrollArea className={styles.scrollColumn}>
              <Stack align="center" gap={4} pt="sm" pb="sm">
                {HOURS.map((hour) => (
                  <Box
                    key={hour}
                    onClick={() => setSelectedHour(hour)}
                    className={styles.scrollItem}
                  >
                    <Text
                      className={
                        hour === selectedHour ? styles.timeValueSelected : styles.timeValue
                      }
                    >
                      {hour}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </ScrollArea>

            <ScrollArea className={styles.scrollColumn}>
              <Stack align="center" gap={4} pt="sm" pb="sm">
                {MINUTES.map((minute) => (
                  <Box
                    key={minute}
                    onClick={() => setSelectedMinute(minute)}
                    className={styles.scrollItem}
                  >
                    <Text
                      className={
                        minute === selectedMinute ? styles.timeValueSelected : styles.timeValue
                      }
                    >
                      {minute}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </ScrollArea>
          </Group>

          <Button fullWidth radius="md" onClick={handleConfirm}>
            אישור
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export default TimePickerField;


