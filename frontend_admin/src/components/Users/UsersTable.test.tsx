import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test/utils';
import userEvent from '@testing-library/user-event';
import { UsersTable } from './UsersTable';
import { useUsers } from '../../hooks/useUsers';

// Mock the useUsers hook
vi.mock('../../hooks/useUsers');

const mockUseUsers = vi.mocked(useUsers);

// Mock user data matching backend API response structure
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    mail: 'john@example.com',
    userType: 'admin' as const,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    mail: 'jane@example.com',
    userType: 'worker' as const,
    active: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Bob Wilson',
    mail: 'bob@example.com',
    userType: 'worker' as const,
    active: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

describe('UsersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseUsers.mockReturnValue({
      usersQuery: {
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any,
      createUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      updateUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      deleteUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      resetPasswordMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
    });

    const { container } = render(<UsersTable />);
    // Mantine Loader renders as a span with mantine-Loader-root class
    const loader = container.querySelector('.mantine-Loader-root');
    expect(loader).toBeInTheDocument();
  });

  it('renders users table with data', async () => {
    mockUseUsers.mockReturnValue({
      usersQuery: {
        data: mockUsers,
        isLoading: false,
        isError: false,
        error: null,
      } as any,
      createUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      updateUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      deleteUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      resetPasswordMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
    });

    render(<UsersTable />);

    // Check that user names are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();

    // Check that emails are displayed
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('renders search input and create button', () => {
    mockUseUsers.mockReturnValue({
      usersQuery: {
        data: mockUsers,
        isLoading: false,
        isError: false,
        error: null,
      } as any,
      createUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      updateUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      deleteUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      resetPasswordMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
    });

    render(<UsersTable />);

    expect(screen.getByPlaceholderText('חיפוש לפי שם או אימייל')).toBeInTheDocument();
    expect(screen.getByText('צור משתמש חדש')).toBeInTheDocument();
  });

  it('filters users by search query', async () => {
    const user = userEvent.setup();
    mockUseUsers.mockReturnValue({
      usersQuery: {
        data: mockUsers,
        isLoading: false,
        isError: false,
        error: null,
      } as any,
      createUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      updateUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      deleteUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      resetPasswordMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
    });

    render(<UsersTable />);

    const searchInput = screen.getByPlaceholderText('חיפוש לפי שם או אימייל');
    await user.type(searchInput, 'John');

    // After filtering, only John Doe should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseUsers.mockReturnValue({
      usersQuery: {
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load users'),
      } as any,
      createUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      updateUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      deleteUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      resetPasswordMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
    });

    render(<UsersTable />);

    expect(screen.getByText('Failed to load users.')).toBeInTheDocument();
  });

  it('renders empty state when no users', () => {
    mockUseUsers.mockReturnValue({
      usersQuery: {
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as any,
      createUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      updateUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      deleteUserMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
      resetPasswordMutation: {
        mutateAsync: vi.fn(),
        isPending: false,
      } as any,
    });

    render(<UsersTable />);

    expect(screen.getByText('לא נמצאו משתמשים')).toBeInTheDocument();
  });
});
