import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Restore real timers if fake timers were used
  if (vi.isFakeTimers()) {
    vi.useRealTimers();
  }
});

// Mock window.matchMedia for Mantine components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver (required by some Mantine components)
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
(global as any).IntersectionObserver = IntersectionObserverMock;

// Mock image imports
vi.mock('@images/LeftArrowIcon.png', () => ({ default: 'left-arrow.png' }));
vi.mock('@images/RightArrowIcon.png', () => ({ default: 'right-arrow.png' }));
vi.mock('@images/EditIcon.png', () => ({ default: 'edit-icon.png' }));
vi.mock('@images/WorkDayLogo.png', () => ({ default: 'work-day-logo.png' }));
vi.mock('@images/CalendarNotWorkIcon.png', () => ({ default: 'calendar-not-work-icon.png' }));
vi.mock('@images/HalfDayOffandWorkLogo.png', () => ({ default: 'half-day-work-logo.png' }));
vi.mock('@images/empty_list.png', () => ({ default: 'empty-list.png' }));
vi.mock('@images/next_month_background.png', () => ({ default: 'next-month-bg.png' }));
vi.mock('@images/Oops! 404 Error with a broken robot-pana 1.png', () => ({ default: 'error-image.png' }));
vi.mock('@images/play.png', () => ({ default: 'play.png' }));
vi.mock('@images/new_report.png', () => ({ default: 'new-report.png' }));
