import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ErrorState } from './ErrorState';
import { HEBREW_STRINGS } from '../../utils/constants';

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('ErrorState', () => {
  it('renders error title and message', () => {
    renderWithProvider(<ErrorState onRetry={() => {}} />);
    
    // Use regex to match text that may contain emojis
    expect(screen.getByText(/אופססס/)).toBeInTheDocument();
    expect(screen.getByText(HEBREW_STRINGS.errorMessage)).toBeInTheDocument();
  });

  it('renders retry button', () => {
    renderWithProvider(<ErrorState onRetry={() => {}} />);
    
    expect(screen.getByText(HEBREW_STRINGS.retryButton)).toBeInTheDocument();
  });

  it('calls onRetry when button is clicked', () => {
    const onRetry = vi.fn();
    renderWithProvider(<ErrorState onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText(HEBREW_STRINGS.retryButton));
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders error image', () => {
    renderWithProvider(<ErrorState onRetry={() => {}} />);
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });
});
