import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { EmptyState } from './EmptyState';

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('EmptyState', () => {
  it('renders future month empty state with image', () => {
    renderWithProvider(<EmptyState type="future" />);
    
    // Check that an image is rendered
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('renders no data empty state with image', () => {
    renderWithProvider(<EmptyState type="noData" />);
    
    // Check that an image is rendered
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('renders image for empty state', () => {
    renderWithProvider(<EmptyState type="noData" />);
    
    // Check that an image is rendered
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });
});
