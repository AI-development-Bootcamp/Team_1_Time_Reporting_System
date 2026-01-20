import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { StatusBadge } from './StatusBadge';
import { BADGE_LABELS } from '../../utils/constants';

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('StatusBadge', () => {
  describe('Work hours badge', () => {
    it('shows green badge for 9+ hours (full day)', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20"
          status="work"
          totalMinutes={540} // 9 hours
        />
      );
      expect(screen.getByText("9 ש'")).toBeInTheDocument();
    });

    it('shows orange badge for less than 9 hours (partial day)', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20"
          status="work"
          totalMinutes={480} // 8 hours
        />
      );
      expect(screen.getByText("8 ש'")).toBeInTheDocument();
    });
  });

  describe('Special status badges', () => {
    it('shows weekend badge for Friday without status', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-17" // Friday
        />
      );
      expect(screen.getByText(BADGE_LABELS.weekend)).toBeInTheDocument();
    });

    it('shows weekend badge for Saturday without status', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-18" // Saturday
        />
      );
      expect(screen.getByText(BADGE_LABELS.weekend)).toBeInTheDocument();
    });

    it('shows missing badge for workday with isMissing', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20" // Monday
          isMissing={true}
        />
      );
      expect(screen.getByText(BADGE_LABELS.missing)).toBeInTheDocument();
    });

    it('shows day off badge', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20"
          status="dayOff"
        />
      );
      expect(screen.getByText(BADGE_LABELS.dayOff)).toBeInTheDocument();
    });

    it('shows sickness badge with document', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20"
          status="sickness"
          hasDocument={true}
        />
      );
      expect(screen.getByText(BADGE_LABELS.sickness)).toBeInTheDocument();
    });

    it('shows missing badge for sickness without document', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20"
          status="sickness"
          hasDocument={false}
        />
      );
      expect(screen.getByText(BADGE_LABELS.missing)).toBeInTheDocument();
    });

    it('shows reserves badge with document', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20"
          status="reserves"
          hasDocument={true}
        />
      );
      expect(screen.getByText(BADGE_LABELS.reserves)).toBeInTheDocument();
    });

    it('shows half day off badge', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20"
          status="halfDayOff"
        />
      );
      expect(screen.getByText(BADGE_LABELS.halfDayOff)).toBeInTheDocument();
    });
  });

  describe('Combined badges', () => {
    it('shows half day off with work hours when both present', () => {
      renderWithProvider(
        <StatusBadge
          date="2025-01-20"
          status="halfDayOff"
          totalMinutes={240} // 4 hours
          hasBothHalfDayAndWork={true}
        />
      );
      // Should show "חצי חופש/4 ש'"
      expect(screen.getByText(/חצי חופש/)).toBeInTheDocument();
    });
  });
});
