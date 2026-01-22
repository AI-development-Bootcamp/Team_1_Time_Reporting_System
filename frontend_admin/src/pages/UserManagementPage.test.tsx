import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test/utils';
import { UserManagementPage } from './UserManagementPage';
import { useUsers } from '../hooks/useUsers';

// Mock the useUsers hook
vi.mock('../hooks/useUsers');

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
];

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title and subtitle', () => {
    mockUseUsers.mockReturnValue({
      usersQuery: {
        data: mockUsers,
        isLoading: false,
        isError: false,
        error: null,
      },
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

    render(<UserManagementPage />);

    expect(screen.getByText('יצירת/שינוי משתמש')).toBeInTheDocument();
    expect(
      screen.getByText('כאן תוכל לנהל משתמשים במערכת - ליצור, לערוך, למחוק ולאפס סיסמאות.')
    ).toBeInTheDocument();
  });

  it('renders UsersTable component', () => {
    mockUseUsers.mockReturnValue({
      usersQuery: {
        data: mockUsers,
        isLoading: false,
        isError: false,
        error: null,
      },
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

    render(<UserManagementPage />);

    // UsersTable should render the search input
    expect(screen.getByPlaceholderText('חיפוש לפי שם או אימייל')).toBeInTheDocument();
  });
});
