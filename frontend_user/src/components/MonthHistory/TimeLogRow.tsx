/**
 * TimeLogRow Component
 * Displays a single time log entry with duration and project name
 */

import { Group, Text } from '@mantine/core';
import { ProjectTimeLog } from '../../types';
import { formatDurationHours } from '../../utils/dateUtils';
import styles from './TimeLogRow.module.css';

interface TimeLogRowProps {
  /** Time log data */
  timeLog: ProjectTimeLog;
}

export function TimeLogRow({ timeLog }: TimeLogRowProps) {
  const timeFormatted = formatDurationHours(timeLog.duration);
  const projectName = timeLog.task.project.name;

  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap={4} wrap="nowrap">
        <Text size="sm" c="dimmed">
          'ש
        </Text>
        <Text size="sm" c="dimmed" dir="ltr" className={styles.ltrText}>
          {timeFormatted}
        </Text>
      </Group>
      <Text size="sm" c="dimmed">
        {projectName}
      </Text>
    </Group>
  );
}
