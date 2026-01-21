/**
 * BottomBar Component
 * Fixed bottom bar with Start Timer (disabled) and Manual Report buttons
 */

import { UnstyledButton, Text, Image } from '@mantine/core';
import { HEBREW_STRINGS } from '../../utils/constants';
import playIcon from '@images/play.png';
import newReportIcon from '@images/new_report.png';
import classes from './BottomBar.module.css';

interface BottomBarProps {
  /** Callback when manual report button is clicked */
  onManualReport: () => void;
}

/**
 * Renders a fixed bottom bar with a disabled "Start Timer" action and an active "Manual Report" action.
 *
 * The "Start Timer" button is displayed disabled with a play icon and Hebrew label.
 * The "Manual Report" button displays a Hebrew label and icon and invokes the provided callback when clicked.
 *
 * @param onManualReport - Callback invoked when the Manual Report button is clicked
 * @returns The BottomBar React element
 */
export function BottomBar({ onManualReport }: BottomBarProps) {
  return (
    <div className={classes.bottomBar}>
      {/* Start Timer - Disabled */}
      <UnstyledButton className={classes.startTimerButton} disabled>
        <Image src={playIcon} alt="" className={classes.startTimerIcon} />
        <Text size="sm" fw={500} c="dimmed">
          {HEBREW_STRINGS.startTimer}
        </Text>
      </UnstyledButton>

      {/* Vertical Divider */}
      <div className={classes.divider} />

      {/* Manual Report */}
      <UnstyledButton className={classes.manualReportButton} onClick={onManualReport}>
        <Text size="sm" fw={500} c="dark">
          {HEBREW_STRINGS.manualReport}
        </Text>
        <Image src={newReportIcon} alt="" className={classes.manualReportIcon} />
      </UnstyledButton>
    </div>
  );
}