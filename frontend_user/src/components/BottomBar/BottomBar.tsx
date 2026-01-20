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

      {/* Manual Report */}
      <UnstyledButton className={classes.manualReportButton} onClick={onManualReport}>
        <Image src={newReportIcon} alt="" className={classes.manualReportIcon} />
        <Text size="sm" fw={500} c="white">
          {HEBREW_STRINGS.manualReport}
        </Text>
      </UnstyledButton>
    </div>
  );
}
