/**
 * DayAccordionItem Component
 * Displays a single day row in the accordion with its attendances
 */

import { Accordion, Group, Text, Stack, Button, Image } from '@mantine/core';
import { DailyAttendance } from '../../types';
import { StatusBadge } from './StatusBadge';
import { DailyAttendanceCard } from './DailyAttendanceCard';
import { formatDate, getHebrewDayName, isWorkday, calculateDurationMinutes } from '../../utils/dateUtils';
import { HEBREW_STRINGS } from '../../utils/constants';
import workDayIcon from '@images/WorkDayLogo.png';
import notWorkIcon from '@images/CalendarNotWorkIcon.png';
import halfDayWorkIcon from '@images/HalfDayOffandWorkLogo.png';
import classes from './DayAccordionItem.module.css';

interface DayAccordionItemProps {
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Attendance records for this date */
  attendances: DailyAttendance[];
  /** Callback when edit button is clicked */
  onEdit?: (attendanceId: string) => void;
  /** Callback when add report button is clicked */
  onAddReport?: (date: string) => void;
}

/**
 * Compute the sum of durations (in minutes) for attendances that have both start and end times.
 *
 * @param attendances - Array of daily attendance records to include in the calculation
 * @returns The total duration in minutes for attendances with both `startTime` and `endTime` (0 if none)
 */
function calculateTotalMinutes(attendances: DailyAttendance[]): number {
  return attendances.reduce((total, att) => {
    if (att.startTime && att.endTime) {
      return total + calculateDurationMinutes(att.startTime, att.endTime);
    }
    return total;
  }, 0);
}

/**
 * Selects a single status to represent a day's attendances.
 *
 * Chooses a priority-based status for badge display: prefers `dayOff`, then `sickness`, then `reserves`, then `halfDayOff` (treated as `halfDayOff` when combined with `work`), then `work`; if none match, returns the first attendance's status.
 *
 * @param attendances - Array of daily attendance records to evaluate
 * @returns The selected status (`'dayOff'`, `'sickness'`, `'reserves'`, `'halfDayOff'`, `'work'`, or another status from the first attendance), or `undefined` when `attendances` is empty
 */
function getPrimaryStatus(attendances: DailyAttendance[]) {
  if (attendances.length === 0) return undefined;
  
  // Check for specific statuses
  const hasHalfDayOff = attendances.some((a) => a.status === 'halfDayOff');
  const hasWork = attendances.some((a) => a.status === 'work');
  const hasDayOff = attendances.some((a) => a.status === 'dayOff');
  const hasSickness = attendances.some((a) => a.status === 'sickness');
  const hasReserves = attendances.some((a) => a.status === 'reserves');

  // Priority order for display
  if (hasDayOff) return 'dayOff';
  if (hasSickness) return 'sickness';
  if (hasReserves) return 'reserves';
  if (hasHalfDayOff && hasWork) return 'halfDayOff'; // Combined badge
  if (hasHalfDayOff) return 'halfDayOff';
  if (hasWork) return 'work';

  return attendances[0].status;
}

/**
 * Determines whether any attendance includes a submitted document.
 *
 * @returns `true` if at least one attendance has `document === true`, `false` otherwise.
 */
function hasAnyDocument(attendances: DailyAttendance[]): boolean {
  return attendances.some((a) => a.document === true);
}

/**
 * Render an accordion item for a single date that displays a status badge, date label, calendar icon, and the day's attendance entries.
 *
 * Renders a header summarizing the day's attendance (primary status, total minutes, document presence, and missing/workday indicators) and a panel containing one DailyAttendanceCard per attendance plus an Add Report button which is hidden for day-off, sickness, or reserves statuses.
 *
 * @param date - The day in `YYYY-MM-DD` format represented by this accordion item
 * @param attendances - Array of DailyAttendance objects for `date`
 * @param onEdit - Optional callback invoked with an attendance id when an attendance card requests edit
 * @param onAddReport - Optional callback invoked with `date` when the Add Report button is clicked
 * @returns The rendered accordion item for the given date
 */
export function DayAccordionItem({
  date,
  attendances,
  onEdit,
  onAddReport,
}: DayAccordionItemProps) {
  const dateOnly = formatDate(date);
  const dayLabel = getHebrewDayName(date);
  const isWorkingDay = isWorkday(date);
  const hasAttendances = attendances.length > 0;
  const isMissing = isWorkingDay && !hasAttendances;

  const totalMinutes = calculateTotalMinutes(attendances);
  const primaryStatus = getPrimaryStatus(attendances);
  const hasDocument = hasAnyDocument(attendances);
  const hasBothHalfDayAndWork =
    attendances.some((a) => a.status === 'halfDayOff') &&
    attendances.some((a) => a.status === 'work');

  // Determine which calendar icon to show
  const getCalendarIcon = () => {
    // HalfDayOff + Work combined
    if (hasBothHalfDayAndWork) {
      return halfDayWorkIcon;
    }
    
    // Non-work statuses: dayOff, sickness, reserves, halfDayOff only
    const hasNonWorkStatus = attendances.some((a) =>
      ['dayOff', 'sickness', 'reserves', 'halfDayOff'].includes(a.status)
    );
    if (hasNonWorkStatus) {
      return notWorkIcon;
    }
    
    // For workdays (Sunday-Thursday), show work icon
    // This includes missing days on workdays
    if (isWorkingDay) {
      return workDayIcon;
    }
    
    // Weekend or other non-workdays
    return notWorkIcon;
  };
  
  const calendarIcon = getCalendarIcon();

  const handleAddReport = () => {
    onAddReport?.(date);
  };

  return (
    <Accordion.Item value={date} className={classes.item}>
      <Accordion.Control className={classes.control}>
        <Group justify="space-between" wrap="nowrap" className={classes.header}>
          <StatusBadge
            date={date}
            status={primaryStatus}
            totalMinutes={totalMinutes}
            hasDocument={hasDocument}
            isMissing={isMissing}
            hasBothHalfDayAndWork={hasBothHalfDayAndWork}
          />
          <Group gap="xs" wrap="nowrap">
            <Group gap={4} wrap="nowrap">
              <Text size="sm" fw={500} style={{ direction: 'ltr' }}>{dayLabel}</Text>
              <Text size="sm" fw={500}>,</Text>
              <Text size="sm" fw={500}>{dateOnly}</Text>
            </Group>
            <Image src={calendarIcon} alt="" w={20} h={20} className={classes.calendarIcon} />
          </Group>
        </Group>
      </Accordion.Control>

      <Accordion.Panel className={classes.panel}>
        <Stack gap="xs">
          {/* Attendance cards */}
          {attendances.map((attendance) => (
            <DailyAttendanceCard
              key={attendance.id}
              attendance={attendance}
              onEdit={onEdit}
            />
          ))}

          {/* Add report button - Hide for dayOff, sickness, reserves */}
          {!attendances.some((a) =>
            ['dayOff', 'sickness', 'reserves'].includes(a.status)
          ) && (
            <Button
              variant="subtle"
              color="blue"
              size="sm"
              onClick={handleAddReport}
              className={classes.addButton}
            >
              {HEBREW_STRINGS.addReport}
            </Button>
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}