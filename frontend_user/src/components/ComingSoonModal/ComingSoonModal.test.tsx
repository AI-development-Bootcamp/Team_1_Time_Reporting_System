import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ComingSoonModal } from './ComingSoonModal';
import { HEBREW_STRINGS } from '../../utils/constants';

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('ComingSoonModal', () => {
  it('renders modal content when opened', () => {
    renderWithProvider(<ComingSoonModal opened={true} onClose={() => {}} />);
    
    expect(screen.getByText(HEBREW_STRINGS.comingSoonTitle)).toBeInTheDocument();
    expect(screen.getByText(HEBREW_STRINGS.comingSoonMessage)).toBeInTheDocument();
    expect(screen.getByText(HEBREW_STRINGS.comingSoonButton)).toBeInTheDocument();
  });

  it('does not render modal content when closed', () => {
    renderWithProvider(<ComingSoonModal opened={false} onClose={() => {}} />);
    
    expect(screen.queryByText(HEBREW_STRINGS.comingSoonTitle)).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(<ComingSoonModal opened={true} onClose={onClose} />);
    
    fireEvent.click(screen.getByText(HEBREW_STRINGS.comingSoonButton));
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
