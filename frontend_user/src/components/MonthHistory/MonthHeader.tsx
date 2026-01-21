/**
 * MonthHeader Component
 * Displays page title and month navigation
 */

import { Group, Title, Text, UnstyledButton, Image } from '@mantine/core';
import { HEBREW_STRINGS } from '../../utils/constants';
import { getHebrewMonthName } from '../../utils/dateUtils';
import leftArrowIcon from '@images/LeftArrowIcon.png';
import rightArrowIcon from '@images/RightArrowIcon.png';
import classes from './MonthHeader.module.css';

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
          onClick={onNextMonth}
          disabled={isNextDisabled}
          className={classes.navButton}
          data-disabled={isNextDisabled || undefined}
        >
          <Image src={leftArrowIcon} alt="Next month" w={24} h={24} />
        </UnstyledButton>

        <Text size="md" fw={500} className={classes.monthName}>
          {monthName}
        </Text>

        {/* Right arrow = Previous month (back in RTL) */}
        <UnstyledButton
          onClick={onPreviousMonth}
          disabled={isPreviousDisabled}
          className={classes.navButton}
          data-disabled={isPreviousDisabled || undefined}
        >
          <Image src={rightArrowIcon} alt="Previous month" w={24} h={24} />
        </UnstyledButton>
      </Group>

      {/* Page title - on the right in RTL */}
      <Title order={2} className={classes.title}>
        {HEBREW_STRINGS.pageTitle}
      </Title>
    </div>
  );
}
