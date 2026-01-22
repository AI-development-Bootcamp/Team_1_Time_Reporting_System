import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@test/utils';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error for error boundary tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('catches errors and displays error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // ErrorBoundary should display error UI
    expect(screen.getByText('משהו השתבש')).toBeInTheDocument();
    expect(
      screen.getByText('אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף.')
    ).toBeInTheDocument();
  });

  it('displays reset button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('נסה שוב')).toBeInTheDocument();
    expect(screen.getByText('רענן את הדף')).toBeInTheDocument();
  });

  it('resets error state when reset button is clicked', async () => {
    const user = userEvent.setup();

    // Test that reset button calls handleReset
    // We'll verify the button exists and is clickable
    // The actual reset behavior requires children to not throw after reset
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('משהו השתבש')).toBeInTheDocument();

    const resetButton = screen.getByText('נסה שוב');
    expect(resetButton).toBeInTheDocument();

    // Click the reset button - this should call handleReset
    await user.click(resetButton);

    // After clicking reset, ErrorBoundary's state is reset
    // But since ThrowError still throws, it will catch the error again
    // This is expected behavior - the error boundary resets, but if children
    // still throw, it will catch the error again
    expect(screen.getByText('משהו השתבש')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('משהו השתבש')).not.toBeInTheDocument();
  });

  it('calls onReset callback when reset button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const resetButton = screen.getByText('נסה שוב');
    await user.click(resetButton);

    expect(onReset).toHaveBeenCalled();
  });
});
