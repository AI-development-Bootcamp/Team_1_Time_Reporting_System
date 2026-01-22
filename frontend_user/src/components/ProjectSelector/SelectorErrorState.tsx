/**
 * SelectorErrorState Component
 * Error state for project selector with Hebrew error images
 * 
 * Features:
 * - Error message image (Hebrew text)
 * - Broken robot illustration
 * - Return to main screen link
 * - Disabled continue button
 * - Mobile-first, RTL design
 */

import { Button, Stack, Text, Anchor } from '@mantine/core';
import errorMessageImg from '../../../../../shared/image_components/error_message.png';
import brokenRobotImg from '../../../../../shared/image_components/Oops! 404 Error with a broken robot-pana 1.png';
import classes from './SelectorErrorState.module.css';

interface SelectorErrorStateProps {
  /** Callback when user clicks "return to main screen" link */
  onReturnToMain?: () => void;
}

/**
 * SelectorErrorState - Display error state in project selector
 * 
 * @example
 * <SelectorErrorState
 *   onReturnToMain={() => navigate('/main')}
 * />
 */
export function SelectorErrorState({
  onReturnToMain,
}: SelectorErrorStateProps) {
  return (
    <div className={classes.container}>
      <Stack gap="lg" align="center">
        {/* Error Message Image (contains Hebrew text) */}
        <div className={classes.errorMessageContainer}>
          <img
            src={errorMessageImg}
            alt="שגיאה"
            className={classes.errorMessageImage}
          />
        </div>

        {/* Broken Robot Illustration */}
        <div className={classes.robotContainer}>
          <img
            src={brokenRobotImg}
            alt="רובוט שבור"
            className={classes.robotImage}
          />
        </div>

        {/* Return to Main Screen Link */}
        <Anchor
          onClick={onReturnToMain}
          className={classes.returnLink}
          underline="always"
        >
          חזור למסך ראשי
        </Anchor>

        {/* Disabled Continue Button */}
        <Button
          disabled
          size="lg"
          className={classes.disabledButton}
        >
          המשך ובחר מיקום
        </Button>

        {/* Additional Context Text */}
        <Text size="sm" c="dimmed" ta="center" className={classes.contextText}>
          אירעה שגיאה בטעינת הנתונים
        </Text>
      </Stack>
    </div>
  );
}
