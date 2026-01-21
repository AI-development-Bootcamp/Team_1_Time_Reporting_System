/**
 * StatusBadge Component
 * Displays status badge based on attendance status, hours worked, or weekend
 */

import { Badge, Group } from '@mantine/core';
import { DailyAttendanceStatus } from '../../types';
import {
  BADGE_COLORS,
  BADGE_LABELS,
  FULL_WORK_DAY_MINUTES,
  DOCUMENT_REQUIRED_STATUSES,
} from '../../utils/constants';
import { isWeekend } from '../../utils/dateUtils';
import classes from './StatusBadge.module.css';

interface StatusBadgeProps {
  /** Date string (YYYY-MM-DD) for weekend detection */
  date: string;
  /** Attendance status */
  status?: DailyAttendanceStatus;
  /** Total minutes worked (for work status) */
  totalMinutes?: number;
  /** Whether document exists (for sickness/reserves) */
  hasDocument?: boolean;
  /** Whether there's no attendance for this date (missing) */
  isMissing?: boolean;
  /** Whether this is a combined badge (halfDayOff + work) */
  hasBothHalfDayAndWork?: boolean;
}

type BadgeColorType = 'green' | 'orange' | 'blue' | 'red';

interface BadgeConfig {
  label: string;
  colorType: BadgeColorType;
}

/**
 * Get badge configuration based on status and conditions
 */
function getBadgeConfig(props: StatusBadgeProps): BadgeConfig {
  const {
    date,
    status,
    totalMinutes = 0,
    hasDocument,
    isMissing,
    hasBothHalfDayAndWork,
  } = props;

  // Weekend badge
  if (isWeekend(date) && !status) {
    return { label: BADGE_LABELS.weekend, colorType: 'blue' };
  }

  // Missing badge (no attendance on workday)
  if (isMissing) {
    return { label: BADGE_LABELS.missing, colorType: 'red' };
  }

  // No status provided
  if (!status) {
    return { label: BADGE_LABELS.missing, colorType: 'red' };
  }

  // Sickness/Reserves without document = missing
  if (
    DOCUMENT_REQUIRED_STATUSES.includes(status as typeof DOCUMENT_REQUIRED_STATUSES[number]) &&
    !hasDocument
  ) {
    return { label: BADGE_LABELS.missing, colorType: 'red' };
  }

  // Status-based badges
  switch (status) {
    case 'dayOff':
      return { label: BADGE_LABELS.dayOff, colorType: 'blue' };

    case 'halfDayOff':
      // Combined badge if there's also work
      if (hasBothHalfDayAndWork && totalMinutes > 0) {
        const hours = totalMinutes / 60;
        const formatted = hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
        // Build: prefix + number + space + suffix
        const label = BADGE_LABELS.halfDayWorkPrefix + formatted + ' ' + BADGE_LABELS.hoursSuffix;
        return {
          label,
          colorType: totalMinutes >= FULL_WORK_DAY_MINUTES ? 'green' : 'orange',
        };
      }
      return { label: BADGE_LABELS.halfDayOff, colorType: 'blue' };

    case 'sickness':
      return { label: BADGE_LABELS.sickness, colorType: 'blue' };

    case 'reserves':
      return { label: BADGE_LABELS.reserves, colorType: 'blue' };

    case 'work':
      const hours = totalMinutes / 60;
      const formatted = hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
      // Build: number + space + suffix
      const label = formatted + ' ' + BADGE_LABELS.hoursSuffix;
      return {
        label,
        colorType: totalMinutes >= FULL_WORK_DAY_MINUTES ? 'green' : 'orange',
      };

    default:
      return { label: BADGE_LABELS.missing, colorType: 'red' };
  }
}

export function StatusBadge(props: StatusBadgeProps) {
  const { label, colorType } = getBadgeConfig(props);
  const colors = BADGE_COLORS[colorType];

  return (
    <Badge
      className={classes.badge}
      styles={{
        root: {
          backgroundColor: colors.light,
          color: colors.dark,
          borderColor: colors.dark,
        },
      }}
      variant="outline"
      size="md"
      radius="xl"
    >
      <Group gap={4}>
        <span className={classes.dot} style={{ backgroundColor: colors.dark }} />
        {label}
      </Group>
    </Badge>
  );
}
