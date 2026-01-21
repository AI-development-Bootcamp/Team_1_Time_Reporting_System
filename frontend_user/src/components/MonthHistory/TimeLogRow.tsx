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

/**
 * Render a single time log row showing the formatted duration and its project name.
 *
 * @param timeLog - The project time log entry to render.
 * @returns A JSX element containing the formatted duration and the associated project name, arranged with space-between alignment.
 */
export function TimeLogRow({ timeLog }: TimeLogRowProps) {
  const timeFormatted = formatDurationHours(timeLog.duration);
  const projectName = timeLog.task.project.name;

  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap={4} wrap="nowrap">
        <Text size="sm" c="dimmed">
          'ש
        </Text>
        <Text size="sm" c="dimmed" dir="ltr" style={{ unicodeBidi: 'embed' }}>
          {timeFormatted}
        </Text>
      </Group>
      <Text size="sm" c="dimmed">
        {projectName}
      </Text>
    </Group>
  );
}