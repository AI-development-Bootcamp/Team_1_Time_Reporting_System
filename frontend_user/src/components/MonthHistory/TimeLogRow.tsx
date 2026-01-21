/**
 * TimeLogRow Component
 * Displays a single time log entry with duration and project name
 */

import { Group, Text } from '@mantine/core';
import { ProjectTimeLog } from '../../types';
import { formatDurationHours } from '../../utils/dateUtils';

interface TimeLogRowProps {
  /** Time log data */
  timeLog: ProjectTimeLog;
}

export function TimeLogRow({ timeLog }: TimeLogRowProps) {
  const durationLabel = formatDurationHours(timeLog.duration);
  const projectName = timeLog.task.project.name;

  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" c="dimmed" dir="ltr" style={{ unicodeBidi: 'embed' }}>
        {durationLabel}
      </Text>
      <Text size="sm" c="dimmed">
        {projectName}
      </Text>
    </Group>
  );
}
