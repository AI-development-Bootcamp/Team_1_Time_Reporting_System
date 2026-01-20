import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { EmptyState } from './EmptyState';
import { HEBREW_STRINGS } from '../../utils/constants';

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('EmptyState', () => {
  it('renders future month empty state', () => {
    renderWithProvider(<EmptyState type="future" />);
    
    // Use regex to match text that may contain emojis
    expect(screen.getByText(/לא הגענו לחודש הזה/)).toBeInTheDocument();
    expect(screen.getByText(HEBREW_STRINGS.futureMonthSubtitle)).toBeInTheDocument();
  });

  it('renders no data empty state', () => {
    renderWithProvider(<EmptyState type="noData" />);
    
    // Use regex to match text that may contain emojis
    expect(screen.getByText(/עוד לא דיווח כלום החודש/)).toBeInTheDocument();
    expect(screen.getByText(HEBREW_STRINGS.noDataSubtitle)).toBeInTheDocument();
  });

  it('renders image for empty state', () => {
    renderWithProvider(<EmptyState type="noData" />);
    
    // Check that an image is rendered
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });
});
