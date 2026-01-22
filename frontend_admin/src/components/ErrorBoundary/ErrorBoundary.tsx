import React, { Component, ReactNode } from 'react';
import { Container, Title, Text, Button, Stack, Paper } from '@mantine/core';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors and display a fallback UI
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * With custom fallback:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container size="sm" className={styles.container}>
          <Paper shadow="md" p="xl" withBorder>
            <Stack gap="lg">
              <Title order={2} ta="center">משהו השתבש</Title>
              <Text ta="center" c="dimmed">
                אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף.
              </Text>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <Paper p="md" bg="red.0" withBorder>
                  <Text fw={700} size="sm" c="red.9" mb="xs">
                    פרטי שגיאה (במצב פיתוח):
                  </Text>
                  <Text size="xs" c="red.9" className={styles.errorText}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text
                      size="xs"
                      c="red.8"
                      mt="xs"
                      className={styles.errorStack}
                    >
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </Paper>
              )}

              <Stack gap="sm">
                <Button onClick={this.handleReset} fullWidth>
                  נסה שוב
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  fullWidth
                >
                  רענן את הדף
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
