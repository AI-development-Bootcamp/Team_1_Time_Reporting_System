/**
 * ErrorState Component
 * Displays error state when API fetch fails
 */

import { Center, Stack, Image, Text, Title, Button } from '@mantine/core';
import { HEBREW_STRINGS } from '../../utils/constants';
import errorImage from '@images/Oops! 404 Error with a broken robot-pana 1.png';
import classes from './ErrorState.module.css';

interface ErrorStateProps {
  /** Callback when retry button is clicked */
  onRetry?: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <Center className={classes.container}>
      <Stack align="center" gap="md">
        <Image
          src={errorImage}
          alt="Error"
          className={classes.image}
          fit="contain"
        />
        <Title order={4} ta="center" className={classes.title}>
          {HEBREW_STRINGS.errorTitle} 😅
        </Title>
        <Text size="sm" c="dimmed" ta="center" className={classes.subtitle}>
          {HEBREW_STRINGS.errorMessage}
        </Text>
        {onRetry && (
          <Button
            variant="light"
            color="pink"
            onClick={onRetry}
            className={classes.retryButton}
          >
            {HEBREW_STRINGS.retryButton}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
