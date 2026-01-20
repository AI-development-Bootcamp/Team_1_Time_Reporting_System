/**
 * EmptyState Component
 * Displays empty state for future months or months with no data
 * Shows only background image, no text
 */

import { Center, Image } from '@mantine/core';
import emptyListImage from '@images/empty_list.png';
import futureMonthImage from '@images/next_month_background.png';
import classes from './EmptyState.module.css';

interface EmptyStateProps {
  /** Type of empty state to display */
  type: 'future' | 'noData';
}

export function EmptyState({ type }: EmptyStateProps) {
  const isFuture = type === 'future';
  const image = isFuture ? futureMonthImage : emptyListImage;

  return (
    <Center className={classes.container}>
      <Image
        src={image}
        alt=""
        className={classes.image}
        fit="contain"
      />
    </Center>
  );
}
