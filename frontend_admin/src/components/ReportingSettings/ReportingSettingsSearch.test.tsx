import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@test/utils';
import userEvent from '@testing-library/user-event';
import { ReportingSettingsSearch } from './ReportingSettingsSearch';

describe('ReportingSettingsSearch', () => {
  // Note: Mantine's useDebouncedValue uses real timers internally
  // So we need to use real timers for these tests

  it('renders with default placeholder', () => {
    const onSearchChange = vi.fn();
    const { container } = render(<ReportingSettingsSearch onSearchChange={onSearchChange} />);

    // Use container query to avoid multiple element issues
    const input = container.querySelector('input[placeholder="חיפוש לפי שם לקוח/פרויקט"]');
    expect(input).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const onSearchChange = vi.fn();
    const { container } = render(
      <ReportingSettingsSearch
        onSearchChange={onSearchChange}
        placeholder="Custom placeholder"
      />
    );

    const input = container.querySelector('input[placeholder="Custom placeholder"]');
    expect(input).toBeInTheDocument();
  });

  it('calls onSearchChange after debounce delay', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const { container } = render(<ReportingSettingsSearch onSearchChange={onSearchChange} />);

    const input = container.querySelector('input[placeholder="חיפוש לפי שם לקוח/פרויקט"]') as HTMLInputElement;

    // Clear any initial calls (component may call onSearchChange with empty string on mount)
    onSearchChange.mockClear();

    // Type text - this will trigger React's onChange
    await user.type(input, 'test');

    // Should not be called immediately (before debounce)
    expect(onSearchChange).not.toHaveBeenCalled();

    // Wait for debounce delay (300ms)
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('test');
    }, { timeout: 1000 });
  });

  it('debounces multiple rapid changes', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const { container } = render(<ReportingSettingsSearch onSearchChange={onSearchChange} />);

    const input = container.querySelector('input[placeholder="חיפוש לפי שם לקוח/פרויקט"]') as HTMLInputElement;

    // Clear any initial calls
    onSearchChange.mockClear();

    // Type characters rapidly
    await user.type(input, 'abc');

    // Wait for debounce - should only be called once with final value
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledTimes(1);
      expect(onSearchChange).toHaveBeenCalledWith('abc');
    }, { timeout: 1000 });
  });

  it('updates input value as user types', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const { container } = render(<ReportingSettingsSearch onSearchChange={onSearchChange} />);

    const input = container.querySelector('input[placeholder="חיפוש לפי שם לקוח/פרויקט"]') as HTMLInputElement;

    await user.type(input, 'project name');

    expect(input.value).toBe('project name');
  });

  it('calls onSearchChange with empty string when input is cleared', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const { container } = render(<ReportingSettingsSearch onSearchChange={onSearchChange} />);

    const input = container.querySelector('input[placeholder="חיפוש לפי שם לקוח/פרויקט"]') as HTMLInputElement;

    // Clear any initial calls
    onSearchChange.mockClear();

    // Type text
    await user.type(input, 'test');

    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('test');
    }, { timeout: 1000 });

    onSearchChange.mockClear();

    // Clear input
    await user.clear(input);

    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('');
    }, { timeout: 1000 });
  });
});
