/**
 * MonthAccordion Component
 * Displays the list of days with their attendances as an accordion
 */

import { Accordion } from '@mantine/core';
import { DailyAttendance } from '../../types';
import { DayAccordionItem } from './DayAccordionItem';
import { generateMonthDates, isCurrentMonth } from '../../utils/dateUtils';
import classes from './MonthAccordion.module.css';

interface MonthAccordionProps {
  /** Month (1-12) */
  month: number;
  /** Year */
  year: number;
  /** Attendance records for the month */
  attendances: DailyAttendance[];
  /** Callback when edit button is clicked */
  onEdit?: (attendanceId: string) => void;
  /** Callback when add report button is clicked */
  onAddReport?: (date: string) => void;
}

/**
 * Group attendances by date
 */
function groupAttendancesByDate(
  attendances: DailyAttendance[]
): Map<string, DailyAttendance[]> {
  const grouped = new Map<string, DailyAttendance[]>();

  for (const attendance of attendances) {
    const existing = grouped.get(attendance.date) || [];
    existing.push(attendance);
    grouped.set(attendance.date, existing);
  }

  return grouped;
}

export function MonthAccordion({
  month,
  year,
  attendances,
  onEdit,
  onAddReport,
}: MonthAccordionProps) {
  // Generate all dates for the month (up to today if current month)
  const isCurrent = isCurrentMonth(month, year);
  const dates = generateMonthDates(month, year, isCurrent);

  // Group attendances by date
  const attendancesByDate = groupAttendancesByDate(attendances);

  return (
    <Accordion
      multiple
      variant="separated"
      className={classes.accordion}
      chevronPosition="left"
    >
      {dates.map((date) => (
        <DayAccordionItem
          key={date}
          date={date}
          attendances={attendancesByDate.get(date) || []}
          onEdit={onEdit}
          onAddReport={onAddReport}
        />
      ))}
    </Accordion>
  );
}
