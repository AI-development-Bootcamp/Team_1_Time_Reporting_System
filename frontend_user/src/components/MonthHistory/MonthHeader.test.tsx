import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MonthHeader } from './MonthHeader';
import { HEBREW_STRINGS } from '../../utils/constants';

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('MonthHeader', () => {
  const defaultProps = {
    month: 1,
    year: 2025,
    onPreviousMonth: vi.fn(),
    onNextMonth: vi.fn(),
  };

  it('renders page title', () => {
    renderWithProvider(<MonthHeader {...defaultProps} />);
    
    expect(screen.getByText(HEBREW_STRINGS.pageTitle)).toBeInTheDocument();
  });

  it('renders Hebrew month name', () => {
    renderWithProvider(<MonthHeader {...defaultProps} month={1} />);
    
    expect(screen.getByText('ינואר')).toBeInTheDocument();
  });

  it('renders different month names', () => {
    const { rerender } = renderWithProvider(<MonthHeader {...defaultProps} month={6} />);
    expect(screen.getByText('יוני')).toBeInTheDocument();

    rerender(
      <MantineProvider>
        <MonthHeader {...defaultProps} month={12} />
      </MantineProvider>
    );
    expect(screen.getByText('דצמבר')).toBeInTheDocument();
  });

  it('calls onPreviousMonth when previous button is clicked', () => {
    const onPreviousMonth = vi.fn();
    renderWithProvider(<MonthHeader {...defaultProps} onPreviousMonth={onPreviousMonth} />);
    
    const buttons = screen.getAllByRole('button');
    // First button in DOM is previous (ChevronRight)
    fireEvent.click(buttons[0]);
    
    expect(onPreviousMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onNextMonth when next button is clicked', () => {
    const onNextMonth = vi.fn();
    renderWithProvider(<MonthHeader {...defaultProps} onNextMonth={onNextMonth} />);
    
    const buttons = screen.getAllByRole('button');
    // Second button in DOM is next (ChevronLeft)
    fireEvent.click(buttons[1]);
    
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });

  it('disables previous button when isPreviousDisabled is true', () => {
    renderWithProvider(<MonthHeader {...defaultProps} isPreviousDisabled={true} />);
    
    const buttons = screen.getAllByRole('button');
    // First button in DOM is previous
    expect(buttons[0]).toHaveAttribute('aria-disabled', 'true');
    expect(buttons[0]).toHaveAttribute('data-disabled', 'true');
  });

  it('disables next button when isNextDisabled is true', () => {
    renderWithProvider(<MonthHeader {...defaultProps} isNextDisabled={true} />);
    
    const buttons = screen.getAllByRole('button');
    // Second button in DOM is next
    expect(buttons[1]).toHaveAttribute('aria-disabled', 'true');
    expect(buttons[1]).toHaveAttribute('data-disabled', 'true');
  });
});
