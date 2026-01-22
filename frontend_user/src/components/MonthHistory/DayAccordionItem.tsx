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
 * Calculate total minutes from all attendances on a date
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
 * Determine the primary status for badge display
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
 * Check if any attendance has a document
 */
function hasAnyDocument(attendances: DailyAttendance[]): boolean {
  return attendances.some((a) => a.document === true);
}

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
          {/* Calendar icon and date - appears on the right in RTL */}
          <Group gap="xs" wrap="nowrap">
            <Image src={calendarIcon} alt="" w={20} h={20} className={classes.calendarIcon} />
            {/* Date text displayed as single string for correct RTL rendering */}
            <Text size="sm" fw={500}>{`${dateOnly}, ${dayLabel}`}</Text>
          </Group>
          {/* Status badge - appears on the left in RTL (near chevron) */}
          <StatusBadge
            date={date}
            status={primaryStatus}
            totalMinutes={totalMinutes}
            hasDocument={hasDocument}
            isMissing={isMissing}
            hasBothHalfDayAndWork={hasBothHalfDayAndWork}
          />
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
