import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test/utils';
import { AppLayout } from './AppLayout';
import { useAuth } from '@hooks/useAuth';

// Mock useAuth hook
vi.mock('@hooks/useAuth');

const mockUseAuth = vi.mocked(useAuth);

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: 'Test Admin',
        mail: 'admin@test.com',
        userType: 'admin',
        active: true,
      },
    });
  });

  it('renders children content', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByText('ניהול לקוחות/פרויקטים')).toBeInTheDocument();
    expect(screen.getByText('הגדרת דיווחי שעות')).toBeInTheDocument();
  });

  it('displays user name from useAuth hook', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Test Admin')).toBeInTheDocument();
  });

  it('displays default "Admin" when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null });

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays default "Admin" when user name is missing', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: '',
        mail: 'admin@test.com',
        userType: 'admin',
        active: true,
      },
    });

    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders with RTL direction', () => {
    const { container } = render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    // Check that AppShell has dir="rtl"
    const appShell = container.querySelector('[dir="rtl"]');
    expect(appShell).toBeInTheDocument();
  });
});
