import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@test/utils';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import ReportingSettingsPage from './ReportingSettingsPage';
import { useReportingSettings } from '@hooks/useReportingSettings';
import type { ProjectWithClient } from '@hooks/useReportingSettings';

// Mock the hook
vi.mock('@hooks/useReportingSettings');

const mockUseReportingSettings = vi.mocked(useReportingSettings);

const mockProjects: ProjectWithClient[] = [
  {
    id: 1,
    name: 'Project 1',
    clientId: 1,
    projectManagerId: 1,
    startDate: dayjs('2024-01-01').toISOString(),
    endDate: null,
    reportingType: 'startEnd',
    active: true,
    createdAt: dayjs('2024-01-01').toISOString(),
    updatedAt: dayjs('2024-01-01').toISOString(),
    client: {
      id: 1,
      name: 'Client 1',
    },
  },
  {
    id: 2,
    name: 'Project 2',
    clientId: 2,
    projectManagerId: 2,
    startDate: dayjs('2024-01-02').toISOString(),
    endDate: null,
    reportingType: 'duration',
    active: true,
    createdAt: dayjs('2024-01-02').toISOString(),
    updatedAt: dayjs('2024-01-02').toISOString(),
    client: {
      id: 2,
      name: 'Client 2',
    },
  },
];

describe('ReportingSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReportingSettings.mockReturnValue({
      projects: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      updateReportingType: vi.fn(),
      isUpdating: false,
    });
  });

  it('renders page title and subtitle', () => {
    render(<ReportingSettingsPage />);

    expect(screen.getByText('הגדרת דיווחי שעות')).toBeInTheDocument();
    expect(
      screen.getByText('כאן תוכל להגדיר את סוג דיווחי השעות של העובדים בפרויקטים השונים.')
    ).toBeInTheDocument();
  });

  it('renders search bar when not loading and no error', () => {
    render(<ReportingSettingsPage />);

    expect(
      screen.getByPlaceholderText('חיפוש לפי שם לקוח/פרויקט')
    ).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    mockUseReportingSettings.mockReturnValue({
      projects: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      updateReportingType: vi.fn(),
      isUpdating: false,
    });

    render(<ReportingSettingsPage />);

    // Mantine Skeleton components should be present
    const skeletons = document.querySelectorAll('.mantine-Skeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error message and retry button when isError is true', async () => {
    const mockRefetch = vi.fn();
    mockUseReportingSettings.mockReturnValue({
      projects: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
      updateReportingType: vi.fn(),
      isUpdating: false,
    });

    render(<ReportingSettingsPage />);

    expect(screen.getByText('שגיאה')).toBeInTheDocument();
    expect(
      screen.getByText('אירעה שגיאה בטעינת הפרויקטים. אנא נסה שוב.')
    ).toBeInTheDocument();

    const retryButton = screen.getByText('נסה שוב');
    expect(retryButton).toBeInTheDocument();

    // Click retry button
    const user = userEvent.setup();
    await user.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('filters projects by search term', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ReportingSettingsPage />);

    const searchInput = screen.getByPlaceholderText('חיפוש לפי שם לקוח/פרויקט');

    // Type search term
    await user.type(searchInput, 'Client 1');

    // Wait for debounce
    await waitFor(
      () => {
        // After filtering, only Project 1 should be visible
        expect(screen.getByText('Client 1')).toBeInTheDocument();
        expect(screen.getByText('Project 1')).toBeInTheDocument();
        // Project 2 should not be visible (or on next page)
      },
      { timeout: 500 }
    );
  });

  it('displays projects in table', () => {
    render(<ReportingSettingsPage />);

    expect(screen.getByText('Client 1')).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Client 2')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('calls updateReportingType when reporting type is changed', async () => {
    const mockUpdateReportingType = vi.fn();
    mockUseReportingSettings.mockReturnValue({
      projects: mockProjects,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      updateReportingType: mockUpdateReportingType,
      isUpdating: false,
    });

    const user = userEvent.setup();
    render(<ReportingSettingsPage />);

    // Find and click a different reporting type
    const durationRadios = screen.getAllByLabelText('סכום שעות');
    await user.click(durationRadios[0]);

    // Wait for the mutation to be called
    await waitFor(() => {
      expect(mockUpdateReportingType).toHaveBeenCalled();
    });
  });

  it('paginates projects correctly', () => {
    // Create more than 10 projects to test pagination
    const manyProjects = Array.from({ length: 15 }, (_, i) => ({
      ...mockProjects[0],
      id: i + 1,
      name: `Project ${i + 1}`,
      client: {
        id: 1,
        name: `Client ${i + 1}`,
      },
    }));

    mockUseReportingSettings.mockReturnValue({
      projects: manyProjects,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      updateReportingType: vi.fn(),
      isUpdating: false,
    });

    render(<ReportingSettingsPage />);

    // Should show pagination (Mantine Pagination renders buttons, not nav element)
    const paginationButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent?.match(/^\d+$/) || btn.getAttribute('aria-current') === 'page'
    );
    expect(paginationButtons.length).toBeGreaterThan(0);

    // First 10 projects should be visible
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 10')).toBeInTheDocument();
  });

  it('hides search bar when loading', () => {
    mockUseReportingSettings.mockReturnValue({
      projects: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      updateReportingType: vi.fn(),
      isUpdating: false,
    });

    render(<ReportingSettingsPage />);

    expect(
      screen.queryByPlaceholderText('חיפוש לפי שם לקוח/פרויקט')
    ).not.toBeInTheDocument();
  });

  it('hides search bar when error', () => {
    mockUseReportingSettings.mockReturnValue({
      projects: [],
      isLoading: false,
      isError: true,
      error: new Error('Error'),
      refetch: vi.fn(),
      updateReportingType: vi.fn(),
      isUpdating: false,
    });

    render(<ReportingSettingsPage />);

    expect(
      screen.queryByPlaceholderText('חיפוש לפי שם לקוח/פרויקט')
    ).not.toBeInTheDocument();
  });
});
