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

/**
 * Renders a centered empty-state image for either a future month or a month with no data.
 *
 * @param type - Determines which empty-state to show: `'future'` selects the future-month illustration and Hebrew alt text indicating future months cannot be viewed; `'noData'` selects the empty-list illustration and Hebrew alt text indicating no data is available.
 * @returns A JSX element containing a centered Image set to `contain`, styled via the component's CSS module.
 */
export function EmptyState({ type }: EmptyStateProps) {
  const isFuture = type === 'future';
  const image = isFuture ? futureMonthImage : emptyListImage;
  const altText = isFuture ? 'לא ניתן לצפות בחודש עתידי' : 'אין נתונים להצגה';

  return (
    <Center className={classes.container}>
      <Image
        src={image}
        alt={altText}
        className={classes.image}
        fit="contain"
      />
    </Center>
  );
}