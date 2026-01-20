import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { BottomBar } from './BottomBar';
import { HEBREW_STRINGS } from '../../utils/constants';

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('BottomBar', () => {
  it('renders start timer button', () => {
    renderWithProvider(<BottomBar onManualReport={() => {}} />);
    
    expect(screen.getByText(HEBREW_STRINGS.startTimer)).toBeInTheDocument();
  });

  it('renders manual report button', () => {
    renderWithProvider(<BottomBar onManualReport={() => {}} />);
    
    expect(screen.getByText(HEBREW_STRINGS.manualReport)).toBeInTheDocument();
  });

  it('start timer button is disabled', () => {
    renderWithProvider(<BottomBar onManualReport={() => {}} />);
    
    const buttons = screen.getAllByRole('button');
    const startTimerButton = buttons.find(btn => btn.textContent?.includes(HEBREW_STRINGS.startTimer));
    expect(startTimerButton).toBeDisabled();
  });

  it('calls onManualReport when manual report button is clicked', () => {
    const onManualReport = vi.fn();
    renderWithProvider(<BottomBar onManualReport={onManualReport} />);
    
    const buttons = screen.getAllByRole('button');
    const manualReportButton = buttons.find(btn => btn.textContent?.includes(HEBREW_STRINGS.manualReport));
    if (manualReportButton) {
      fireEvent.click(manualReportButton);
    }
    
    expect(onManualReport).toHaveBeenCalledTimes(1);
  });
});
