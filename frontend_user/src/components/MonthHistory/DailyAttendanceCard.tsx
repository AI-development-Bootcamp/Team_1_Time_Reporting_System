/**
 * DailyAttendanceCard Component
 * Displays a single attendance record with its time logs
 */

import { Stack, Group, Text, UnstyledButton, Image } from '@mantine/core';
import { DailyAttendance } from '../../types';
import { TimeLogRow } from './TimeLogRow';
import { formatTimeRange } from '../../utils/dateUtils';
import { HEBREW_STRINGS, BADGE_LABELS } from '../../utils/constants';
import editIcon from '@images/EditIcon.png';
import classes from './DailyAttendanceCard.module.css';

interface DailyAttendanceCardProps {
  /** Attendance record */
  attendance: DailyAttendance;
  /** Callback when edit button is clicked */
  onEdit?: (attendanceId: string) => void;
}

/**
 * Map an attendance status to its display label.
 *
 * @param status - The attendance status to map (e.g., 'work', 'dayOff', 'halfDayOff', 'sickness', 'reserves')
 * @returns The corresponding display label from BADGE_LABELS, or an empty string when no label is defined for the status
 */
function getStatusLabel(status: DailyAttendance['status']): string {
  switch (status) {
    case 'dayOff':
      return BADGE_LABELS.dayOff;
    case 'halfDayOff':
      return BADGE_LABELS.halfDayOff;
    case 'sickness':
      return BADGE_LABELS.sickness;
    case 'reserves':
      return BADGE_LABELS.reserves;
    case 'work':
    default:
      return '';
  }
}

/**
 * Render a card for a single daily attendance record.
 *
 * Displays an edit action, a primary label (time range for work status or a status label for non-work),
 * an optional secondary status label for non-work statuses, and a list of project time logs when present.
 *
 * @param attendance - The DailyAttendance record to display.
 * @param onEdit - Optional callback invoked with the attendance `id` when the edit action is triggered.
 * @returns The JSX element representing the attendance card.
 */
export function DailyAttendanceCard({ attendance, onEdit }: DailyAttendanceCardProps) {
  const timeRange = formatTimeRange(attendance.startTime, attendance.endTime);
  const statusLabel = getStatusLabel(attendance.status);
  const hasTimeLogs = attendance.projectTimeLogs.length > 0;
  const isWorkStatus = attendance.status === 'work';

  const handleEdit = () => {
    onEdit?.(attendance.id);
  };

  return (
    <Stack gap="xs" className={classes.card}>
      {/* Header row: Edit button + Time range or Status label */}
      <Group justify="space-between" wrap="nowrap">
        <UnstyledButton onClick={handleEdit} className={classes.editButton}>
          <Group gap={4}>
            <Image src={editIcon} alt="Edit" w={16} h={16} />
            <Text size="sm" c="blue">
              {HEBREW_STRINGS.edit}
            </Text>
          </Group>
        </UnstyledButton>

        <Text size="sm" c="blue" fw={500} dir="ltr" style={{ unicodeBidi: 'embed' }}>
          {isWorkStatus ? timeRange : statusLabel}
        </Text>
      </Group>

      {/* Status label for non-work (below time range) */}
      {!isWorkStatus && statusLabel && (
        <Group justify="flex-end">
          <Text size="sm" c="dimmed">
            {statusLabel}
          </Text>
        </Group>
      )}

      {/* Time logs */}
      {hasTimeLogs && (
        <Stack gap={4} className={classes.timeLogs}>
          {attendance.projectTimeLogs.map((log) => (
            <TimeLogRow key={log.id} timeLog={log} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}