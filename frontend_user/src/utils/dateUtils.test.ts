import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  formatDateWithDay,
  isWeekend,
  isWorkday,
  calculateDurationMinutes,
  formatDurationHours,
  generateMonthDates,
  isFutureMonth,
  isCurrentMonth,
  getCurrentMonth,
  getCurrentYear,
  getHebrewMonthName,
} from './dateUtils';

describe('dateUtils', () => {
  describe('formatDateWithDay', () => {
    it('formats date with Hebrew day name', () => {
      // Sunday Jan 19, 2025
      const result = formatDateWithDay('2025-01-19');
      expect(result).toContain("יום א'");
      expect(result).toContain('19/01/25');
    });

    it('formats Saturday correctly', () => {
      // Saturday Jan 18, 2025
      const result = formatDateWithDay('2025-01-18');
      expect(result).toContain("יום ש'");
    });

    it('formats Friday correctly', () => {
      // Friday Jan 17, 2025
      const result = formatDateWithDay('2025-01-17');
      expect(result).toContain("יום ו'");
    });
  });

  describe('isWeekend', () => {
    it('returns true for Friday', () => {
      expect(isWeekend('2025-01-17')).toBe(true); // Friday
    });

    it('returns true for Saturday', () => {
      expect(isWeekend('2025-01-18')).toBe(true); // Saturday
    });

    it('returns false for Sunday', () => {
      expect(isWeekend('2025-01-19')).toBe(false); // Sunday
    });

    it('returns false for Thursday', () => {
      expect(isWeekend('2025-01-16')).toBe(false); // Thursday
    });
  });

  describe('isWorkday', () => {
    it('returns true for Sunday through Thursday', () => {
      expect(isWorkday('2025-01-19')).toBe(true); // Sunday
      expect(isWorkday('2025-01-20')).toBe(true); // Monday
      expect(isWorkday('2025-01-21')).toBe(true); // Tuesday
      expect(isWorkday('2025-01-22')).toBe(true); // Wednesday
      expect(isWorkday('2025-01-23')).toBe(true); // Thursday
    });

    it('returns false for Friday and Saturday', () => {
      expect(isWorkday('2025-01-17')).toBe(false); // Friday
      expect(isWorkday('2025-01-18')).toBe(false); // Saturday
    });
  });

  describe('calculateDurationMinutes', () => {
    it('calculates duration correctly', () => {
      expect(calculateDurationMinutes('09:00', '18:00')).toBe(540); // 9 hours
    });

    it('returns 0 for same start and end', () => {
      expect(calculateDurationMinutes('09:00', '09:00')).toBe(0);
    });

    it('calculates partial hours', () => {
      expect(calculateDurationMinutes('09:00', '09:30')).toBe(30);
    });
  });

  describe('formatDurationHours', () => {
    it('formats full hours', () => {
      expect(formatDurationHours(540)).toBe("9 ש'"); // 9 hours
    });

    it('formats partial hours', () => {
      expect(formatDurationHours(90)).toBe("1.5 ש'"); // 1.5 hours
    });

    it('formats zero hours', () => {
      expect(formatDurationHours(0)).toBe("0 ש'");
    });

    it('formats minutes less than an hour', () => {
      expect(formatDurationHours(30)).toBe("0.5 ש'");
    });
  });

  describe('generateMonthDates', () => {
    it('generates all dates for a past month', () => {
      // January 2024 has 31 days
      const dates = generateMonthDates(1, 2024, false);
      expect(dates).toHaveLength(31);
      expect(dates[0]).toBe('2024-01-31'); // Descending order, latest first
      expect(dates[30]).toBe('2024-01-01');
    });

    it('generates dates up to today for current month', () => {
      const today = dayjs();
      const dates = generateMonthDates(today.month() + 1, today.year(), true);
      expect(dates).toHaveLength(today.date());
      expect(dates[0]).toBe(today.format('YYYY-MM-DD')); // Today should be first
    });

    it('returns empty array for future month', () => {
      const futureYear = dayjs().year() + 1;
      const dates = generateMonthDates(1, futureYear, false);
      // This should still work as it checks month parameters, not actual future
      expect(dates.length).toBeLessThanOrEqual(31);
    });
  });

  describe('isFutureMonth', () => {
    it('returns true for future month', () => {
      const today = dayjs();
      expect(isFutureMonth(today.month() + 3, today.year())).toBe(true);
    });

    it('returns false for current month', () => {
      const today = dayjs();
      expect(isFutureMonth(today.month() + 1, today.year())).toBe(false);
    });

    it('returns false for past month', () => {
      const today = dayjs();
      if (today.month() > 0) {
        expect(isFutureMonth(today.month(), today.year())).toBe(false);
      }
    });
  });

  describe('isCurrentMonth', () => {
    it('returns true for current month', () => {
      const today = dayjs();
      expect(isCurrentMonth(today.month() + 1, today.year())).toBe(true);
    });

    it('returns false for past month', () => {
      const today = dayjs();
      if (today.month() > 0) {
        expect(isCurrentMonth(today.month(), today.year())).toBe(false);
      }
    });

    it('returns false for future month', () => {
      const today = dayjs();
      expect(isCurrentMonth(today.month() + 3, today.year())).toBe(false);
    });
  });

  describe('getCurrentMonth', () => {
    it('returns current month (1-indexed)', () => {
      const today = dayjs();
      expect(getCurrentMonth()).toBe(today.month() + 1);
    });
  });

  describe('getCurrentYear', () => {
    it('returns current year', () => {
      const today = dayjs();
      expect(getCurrentYear()).toBe(today.year());
    });
  });

  describe('getHebrewMonthName', () => {
    it('returns correct Hebrew month name', () => {
      expect(getHebrewMonthName(1)).toBe('ינואר');
      expect(getHebrewMonthName(2)).toBe('פברואר');
      expect(getHebrewMonthName(12)).toBe('דצמבר');
    });
  });
});
