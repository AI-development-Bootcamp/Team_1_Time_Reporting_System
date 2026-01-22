/**
 * Toast Notification Utilities
 * Hebrew-configured toast messages with RTL support
 * Uses Mantine notifications
 */

import { notifications } from '@mantine/notifications';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default toast configuration with RTL support
 */
const DEFAULT_CONFIG = {
  position: 'top-center' as const,
  autoClose: 4000,
  withCloseButton: true,
  style: {
    direction: 'rtl' as const,
    textAlign: 'right' as const,
  },
};

// ============================================================================
// Blue Info Toast - Hierarchy Validation Errors
// ============================================================================

/**
 * Show blue info toast for hierarchy validation errors
 * Used when user clicks on a field before completing previous steps
 * 
 * @param field The field name that should be selected first (e.g., "פרויקט", "משימה")
 * 
 * @example
 * showHierarchyError("פרויקט"); // "בחר פרויקט קודם"
 * showHierarchyError("משימה");  // "בחר משימה קודם"
 */
export function showHierarchyError(field: string): void {
  notifications.show({
    ...DEFAULT_CONFIG,
    title: 'שים לב',
    message: `בחר ${field} קודם`,
    color: 'blue',
    styles: {
      root: {
        direction: 'rtl',
        textAlign: 'right',
      },
      title: {
        textAlign: 'right',
        fontWeight: 600,
      },
      description: {
        textAlign: 'right',
      },
    },
  });
}

// ============================================================================
// Red Error Toast - Missing Required Fields
// ============================================================================

/**
 * Show red error toast for missing required fields
 * Used when user tries to save with incomplete data
 * 
 * @example
 * showMissingFieldsError();
 */
export function showMissingFieldsError(): void {
  notifications.show({
    ...DEFAULT_CONFIG,
    title: 'שגיאה',
    message: 'חסר לנו פרטים אה ענינים',
    color: 'red',
    styles: {
      root: {
        direction: 'rtl',
        textAlign: 'right',
      },
      title: {
        textAlign: 'right',
        fontWeight: 600,
      },
      description: {
        textAlign: 'right',
      },
    },
  });
}

// ============================================================================
// Green Success Toast - Successful Save
// ============================================================================

/**
 * Show green success toast for successful save
 * Used when daily attendance report is saved successfully
 * 
 * @example
 * showSaveSuccess();
 */
export function showSaveSuccess(): void {
  notifications.show({
    ...DEFAULT_CONFIG,
    title: 'דיווח שעות הושלם',
    message: 'דיווח השעות שלך נשמרו בהצלחה בסיבכת 🙂',
    color: 'green',
    styles: {
      root: {
        direction: 'rtl',
        textAlign: 'right',
      },
      title: {
        textAlign: 'right',
        fontWeight: 600,
      },
      description: {
        textAlign: 'right',
      },
    },
  });
}

// ============================================================================
// Generic Toast Helpers
// ============================================================================

/**
 * Show a custom info toast (blue)
 * 
 * @param message The message to display
 * @param title Optional title
 * 
 * @example
 * showInfo("נא לבחור פרויקט", "שים לב");
 */
export function showInfo(message: string, title?: string): void {
  notifications.show({
    ...DEFAULT_CONFIG,
    title: title || 'מידע',
    message,
    color: 'blue',
    styles: {
      root: {
        direction: 'rtl',
        textAlign: 'right',
      },
      title: {
        textAlign: 'right',
        fontWeight: 600,
      },
      description: {
        textAlign: 'right',
      },
    },
  });
}

/**
 * Show a custom error toast (red)
 * 
 * @param message The error message to display
 * @param title Optional title (defaults to "שגיאה")
 * 
 * @example
 * showError("לא ניתן לשמור את הדיווח");
 */
export function showError(message: string, title?: string): void {
  notifications.show({
    ...DEFAULT_CONFIG,
    title: title || 'שגיאה',
    message,
    color: 'red',
    styles: {
      root: {
        direction: 'rtl',
        textAlign: 'right',
      },
      title: {
        textAlign: 'right',
        fontWeight: 600,
      },
      description: {
        textAlign: 'right',
      },
    },
  });
}

/**
 * Show a custom success toast (green)
 * 
 * @param message The success message to display
 * @param title Optional title (defaults to "הצלחה")
 * 
 * @example
 * showSuccess("הדיווח נשמר בהצלחה");
 */
export function showSuccess(message: string, title?: string): void {
  notifications.show({
    ...DEFAULT_CONFIG,
    title: title || 'הצלחה',
    message,
    color: 'green',
    styles: {
      root: {
        direction: 'rtl',
        textAlign: 'right',
      },
      title: {
        textAlign: 'right',
        fontWeight: 600,
      },
      description: {
        textAlign: 'right',
      },
    },
  });
}

/**
 * Show a custom warning toast (yellow/orange)
 * 
 * @param message The warning message to display
 * @param title Optional title (defaults to "אזהרה")
 * 
 * @example
 * showWarning("יום העבודה טרם הושלם");
 */
export function showWarning(message: string, title?: string): void {
  notifications.show({
    ...DEFAULT_CONFIG,
    title: title || 'אזהרה',
    message,
    color: 'yellow',
    styles: {
      root: {
        direction: 'rtl',
        textAlign: 'right',
      },
      title: {
        textAlign: 'right',
        fontWeight: 600,
      },
      description: {
        textAlign: 'right',
      },
    },
  });
}
