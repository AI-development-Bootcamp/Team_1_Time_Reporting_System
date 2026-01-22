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
 * Get display label for attendance status
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
      {/* Header row: Time range on right, Edit button on left (RTL) */}
      <Group justify="space-between" wrap="nowrap">
        {/* Time range - appears on the right in RTL */}
        <Text size="sm" c="blue" fw={500} dir="ltr" style={{ unicodeBidi: 'embed' }}>
          {isWorkStatus ? timeRange : statusLabel}
        </Text>

        {/* Edit button - appears on the left in RTL */}
        <UnstyledButton onClick={handleEdit} className={classes.editButton}>
          <Group gap={4}>
            <Text size="sm" c="blue">
              {HEBREW_STRINGS.edit}
            </Text>
            <Image src={editIcon} alt="Edit" w={16} h={16} />
          </Group>
        </UnstyledButton>
      </Group>

      {/* Status label for non-work (below time range) */}
      {!isWorkStatus && statusLabel && (
        <Group justify="flex-start">
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
