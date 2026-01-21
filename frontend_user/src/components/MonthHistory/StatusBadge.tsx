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

type BadgeColorType = 'green' | 'orange' | 'blue' | 'red' | 'purple';

interface BadgeConfig {
  label: string;
  colorType: BadgeColorType;
}

/**
 * Determine the badge label and color for an attendance day based on provided props.
 *
 * Evaluates weekend, missing attendance, document-required statuses, half-day-with-work combinations,
 * and work hours to produce a human-readable label and a color key.
 *
 * @param props - Input properties affecting badge selection: `date`, `status`, `totalMinutes`, `hasDocument`, `isMissing`, and `hasBothHalfDayAndWork`.
 * @returns An object with `label` (the text to display) and `colorType` (one of `'green'|'orange'|'blue'|'red'|'purple'`) indicating the badge color category.
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
      // Combined badge if there's also work - PURPLE
      if (hasBothHalfDayAndWork && totalMinutes > 0) {
        const hours = totalMinutes / 60;
        const formatted = hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
        // Build: prefix + number + space + suffix
        const label = BADGE_LABELS.halfDayWorkPrefix + formatted + ' ' + BADGE_LABELS.hoursSuffix;
        return {
          label,
          colorType: 'purple', // Always purple for combined badge
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

// Map badge colors to Unicode symbols
const DOT_SYMBOLS = {
  green: '✓',      // Checkmark - complete work
  orange: '!',     // Checkmark - partial work
  red: '!',        // Exclamation - missing
  blue: 'X',       // X mark - absence/weekend
  purple: '/',     // Slash - half day + work
};

/**
 * Render a colored attendance badge with a status-specific symbol and label.
 *
 * @param props - Component properties controlling date, status, totalMinutes, hasDocument, isMissing, and hasBothHalfDayAndWork
 * @returns A Mantine Badge element containing a colored dot symbol and the computed status label
 */
export function StatusBadge(props: StatusBadgeProps) {
  const { label, colorType } = getBadgeConfig(props);
  const colors = BADGE_COLORS[colorType];
  const symbol = DOT_SYMBOLS[colorType];

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
        <div 
          className={classes.dot} 
          style={{ backgroundColor: colors.dark }}
        >
          {symbol}
        </div>
        {label}
      </Group>
    </Badge>
  );
}