/**
 * Constants for Month History page
 * Colors, Hebrew strings, and configuration values
 */

// ============================================================================
// Hebrew Day Names (Sunday = 0, Saturday = 6)
// ============================================================================

export const HEBREW_DAY_NAMES: Record<number, string> = {
  0: "'יום א",
  1: "'יום ב",
  2: "'יום ג",
  3: "'יום ד",
  4: "'יום ה",
  5: "'יום ו",
  6: "'יום ש",
};

// Short version for badges
export const HEBREW_DAY_NAMES_SHORT: Record<number, string> = {
  0: "א'",
  1: "ב'",
  2: "ג'",
  3: "ד'",
  4: "ה'",
  5: "ו'",
  6: "ש'",
};

// ============================================================================
// Hebrew Month Names (0-indexed: January = 0)
// ============================================================================

export const HEBREW_MONTH_NAMES: Record<number, string> = {
  0: 'ינואר',
  1: 'פברואר',
  2: 'מרץ',
  3: 'אפריל',
  4: 'מאי',
  5: 'יוני',
  6: 'יולי',
  7: 'אוגוסט',
  8: 'ספטמבר',
  9: 'אוקטובר',
  10: 'נובמבר',
  11: 'דצמבר',
};

// ============================================================================
// Badge Colors
// ============================================================================

export const BADGE_COLORS = {
  // Green - work ≥9h (full day)
  green: {
    dark: '#106103',
    light: '#E3F9CA',
  },
  // Orange - work <9h (partial day)
  orange: {
    dark: '#945312',
    light: '#FEF5CC',
  },
  // Blue - absences (dayOff, halfDayOff, sickness, reserves, weekend)
  blue: {
    dark: '#0C3058',
    light: '#F0F4FA',
  },
  // Red - missing attendance
  red: {
    dark: '#AC2632',
    light: '#FCE3D6',
  },
  // Purple - halfDayOff + work combined
  purple: {
    dark: '#AE0088',
    light: '#FFECFC',
  },
} as const;

// ============================================================================
// Work Hours Threshold
// ============================================================================

/** Minimum hours for a "full" work day (green badge) */
export const FULL_WORK_DAY_HOURS = 9;

/** Convert to minutes for comparisons */
export const FULL_WORK_DAY_MINUTES = FULL_WORK_DAY_HOURS * 60;

// ============================================================================
// Hebrew Strings - Page
// ============================================================================

export const HEBREW_STRINGS = {
  // Page title
  pageTitle: 'דיווח שעות',
  
  // Bottom bar
  startTimer: 'הפעלת שעון',
  manualReport: 'דיווח ידני',
  
  // Actions
  edit: 'עריכה',
  addReport: 'הוספת דיווח',
  
  // Coming soon modal
  comingSoonTitle: 'בקרוב',
  comingSoonMessage: 'העמוד בבנייה',
  comingSoonButton: 'סגור',
  
  // Error state
  errorTitle: 'אופססס...',
  errorMessage: 'אין מידע זמין כרגע, נסה שוב מאוחר יותר או פנה למנהל ישיר',
  retryButton: 'נסה שוב',
  
  // Empty state - future month
  futureMonthTitle: 'לא הגענו לחודש הזה',
  futureMonthSubtitle: 'תן לזמן לעשות את שלו - ואז תוכל לדווח גם כאן.',
  
  // Empty state - current month (no data yet)
  noDataTitle: 'עוד לא דיווח כלום החודש',
  noDataSubtitle: 'זה הזמן להכניס את השעות הראשונות הזנה אחת ואתה בעניינים.',
} as const;

// ============================================================================
// Hebrew Strings - Badge Labels
// ============================================================================

export const BADGE_LABELS = {
  // Status badges
  missing: 'חסר',
  weekend: 'סופ"ש',
  dayOff: 'יום חופש',
  halfDayOff: 'חצי יום חופש',
  sickness: 'מחלה',
  reserves: 'מילואים',
  
  // Work hours suffix
  hoursSuffix: "ש'",
  
  // Combined badge (half day + work)
  halfDayWorkPrefix: 'חצי חופש/',
} as const;

// ============================================================================
// Status Types
// ============================================================================

/** Statuses that are exclusive (only one per day) */
export const EXCLUSIVE_STATUSES = ['dayOff', 'sickness', 'reserves'] as const;

/** Statuses that indicate non-work */
export const NON_WORK_STATUSES = ['dayOff', 'sickness', 'reserves', 'halfDayOff'] as const;

/** Statuses that require document */
export const DOCUMENT_REQUIRED_STATUSES = ['sickness', 'reserves'] as const;

// ============================================================================
// Location Labels (Hebrew)
// ============================================================================

export const LOCATION_LABELS = {
  office: 'משרד',
  client: 'לקוח',
  home: 'בית',
} as const;

// ============================================================================
// API Configuration
// ============================================================================

/** Query keys for TanStack Query */
export const QUERY_KEYS = {
  monthHistory: 'monthHistory',
  timeLogs: 'timeLogs',
  projectSelector: 'projectSelector',
  attendance: 'attendance',
} as const;

// ============================================================================
// UI Configuration
// ============================================================================

/** Animation/transition duration in ms */
export const ANIMATION_DURATION = 200;

/** Debounce delay for search inputs */
export const DEBOUNCE_DELAY = 300;
