/**
 * MonthHeader Component
 * Displays page title and month navigation
 */

import { Group, Title, Text, UnstyledButton } from '@mantine/core';
import { HEBREW_STRINGS } from '../../utils/constants';
import { getHebrewMonthName } from '../../utils/dateUtils';
import classes from './MonthHeader.module.css';

// Chevron Left Arrow Icon
const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

// Chevron Right Arrow Icon
const ChevronRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

interface MonthHeaderProps {
  /** Current month (1-12) */
  month: number;
  /** Current year */
  year: number;
  /** Callback when previous month button is clicked */
  onPreviousMonth: () => void;
  /** Callback when next month button is clicked */
  onNextMonth: () => void;
  /** Whether previous month button is disabled */
  isPreviousDisabled?: boolean;
  /** Whether next month button is disabled */
  isNextDisabled?: boolean;
}

export function MonthHeader({
  month,
  year: _year, // Reserved for future use (e.g., display year in header)
  onPreviousMonth,
  onNextMonth,
  isPreviousDisabled = false,
  isNextDisabled = false,
}: MonthHeaderProps) {
  const monthName = getHebrewMonthName(month);

  return (
    <div className={classes.header}>
      {/* Month navigation - on the left in RTL */}
      <Group gap="xs" className={classes.navigation}>
        {/* Left arrow = Next month (forward in RTL) */}
        <UnstyledButton
          onClick={isNextDisabled ? undefined : onNextMonth}
          disabled={isNextDisabled}
          className={classes.navButton}
          data-disabled={isNextDisabled || undefined}
          aria-disabled={isNextDisabled}
          style={{ pointerEvents: isNextDisabled ? 'none' : 'auto' }}
        >
          <ChevronLeft />
        </UnstyledButton>

        <Text size="md" fw={500} className={classes.monthName}>
          {monthName}
        </Text>

        {/* Right arrow = Previous month (back in RTL) */}
        <UnstyledButton
          onClick={isPreviousDisabled ? undefined : onPreviousMonth}
          disabled={isPreviousDisabled}
          className={classes.navButton}
          data-disabled={isPreviousDisabled || undefined}
          aria-disabled={isPreviousDisabled}
          style={{ pointerEvents: isPreviousDisabled ? 'none' : 'auto' }}
        >
          <ChevronRight />
        </UnstyledButton>
      </Group>

      {/* Page title - on the right in RTL */}
      <Title order={2} className={classes.title}>
        {HEBREW_STRINGS.pageTitle}
      </Title>
    </div>
  );
}
