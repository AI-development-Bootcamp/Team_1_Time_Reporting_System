/**
 * ProgressTracker Component
 * Visual progress bar showing reported time vs target time
 * 
 * Features:
 * - Display current/target time in hours
 * - Display missing time if incomplete
 * - Visual progress bar (orange fill, green when complete)
 * - Mobile-first, RTL design
 */

import { Text, Group } from '@mantine/core';
import { formatDurationHours } from '../../utils/dateUtils';
import classes from './ProgressTracker.module.css';

interface ProgressTrackerProps {
  /** Current reported time in minutes */
  current: number;
  /** Target time in minutes (entrance - exit time) */
  target: number;
}

/**
 * ProgressTracker - Visual time progress indicator
 * 
 * @example
 * <ProgressTracker
 *   current={330}  // 5:30 hours reported
 *   target={480}   // 8:00 hours target
 * />
 */
export function ProgressTracker({
  current,
  target,
}: ProgressTrackerProps) {
  // Calculate progress
  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
  const isComplete = current >= target;
  const missing = target - current;

  // Format times
  const currentFormatted = formatDurationHours(current);
  const targetFormatted = formatDurationHours(target);
  const missingFormatted = formatDurationHours(missing);

  return (
    <div className={classes.container}>
      {/* Header - Current/Target Display */}
      <Group justify="space-between" mb="xs" className={classes.header}>
        <Text size="sm" fw={500}>
          {currentFormatted} מתוך {targetFormatted} שעות
        </Text>
        <Text
          size="sm"
          fw={600}
          className={isComplete ? classes.percentageComplete : classes.percentageIncomplete}
        >
          {percentage}%
        </Text>
      </Group>

      {/* Progress Bar */}
      <div className={classes.progressBar}>
        <div
          className={`${classes.progressFill} ${isComplete ? classes.fillComplete : classes.fillIncomplete}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Missing Time Display (if incomplete) */}
      {!isComplete && missing > 0 && (
        <Text size="xs" c="dimmed" mt="xs" className={classes.missingText}>
          חסרות {missingFormatted} שעות לדיווח
        </Text>
      )}

      {/* Complete Message */}
      {isComplete && (
        <Text size="xs" c="green" fw={500} mt="xs" className={classes.completeText}>
          ✓ הדיווח הושלם
        </Text>
      )}
    </div>
  );
}
