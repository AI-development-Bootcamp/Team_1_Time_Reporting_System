/**
 * EmptyState Component
 * Displays empty state for future months or months with no data
 */

import { Center, Stack, Image, Text, Title } from '@mantine/core';
import { HEBREW_STRINGS } from '../../utils/constants';
import emptyListImage from '@images/empty_list.png';
import futureMonthImage from '@images/next_month_background.png';
import classes from './EmptyState.module.css';

interface EmptyStateProps {
  /** Type of empty state to display */
  type: 'future' | 'noData';
}

export function EmptyState({ type }: EmptyStateProps) {
  const isFuture = type === 'future';

  const title = isFuture
    ? HEBREW_STRINGS.futureMonthTitle
    : HEBREW_STRINGS.noDataTitle;

  const subtitle = isFuture
    ? HEBREW_STRINGS.futureMonthSubtitle
    : HEBREW_STRINGS.noDataSubtitle;

  const image = isFuture ? futureMonthImage : emptyListImage;
  const emoji = isFuture ? '😊' : '😅';

  return (
    <Center className={classes.container}>
      <Stack align="center" gap="md">
        <Image
          src={image}
          alt="Empty state"
          className={classes.image}
          fit="contain"
        />
        <Title order={4} ta="center" className={classes.title}>
          {title} {emoji}
        </Title>
        <Text size="sm" c="dimmed" ta="center" className={classes.subtitle}>
          {subtitle}
        </Text>
      </Stack>
    </Center>
  );
}
