import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@test/utils';
import { ReportingSettingsTable } from './ReportingSettingsTable';
import type { ProjectWithClient } from '../../../hooks/useReportingSettings';

const mockProjects: ProjectWithClient[] = [
  {
    id: 1,
    name: 'Project 1',
    clientId: 1,
    reportingType: 'startEnd',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    client: {
      id: 1,
      name: 'Client 1',
    },
  },
  {
    id: 2,
    name: 'Project 2',
    clientId: 2,
    reportingType: 'duration',
    active: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    client: {
      id: 2,
      name: 'Client 2',
    },
  },
];

describe('ReportingSettingsTable', () => {
  it('renders table headers', () => {
    const onReportingTypeChange = vi.fn();
    render(
      <ReportingSettingsTable
        projects={mockProjects}
        onReportingTypeChange={onReportingTypeChange}
      />
    );

    expect(screen.getByText('שם לקוח')).toBeInTheDocument();
    expect(screen.getByText('שם פרויקט')).toBeInTheDocument();
    expect(screen.getByText('סוג הדיווח')).toBeInTheDocument();
  });

  it('renders all projects in the table', () => {
    const onReportingTypeChange = vi.fn();
    render(
      <ReportingSettingsTable
        projects={mockProjects}
        onReportingTypeChange={onReportingTypeChange}
      />
    );

    expect(screen.getByText('Client 1')).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Client 2')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('renders correct reporting type for each project', () => {
    const onReportingTypeChange = vi.fn();
    render(
      <ReportingSettingsTable
        projects={mockProjects}
        onReportingTypeChange={onReportingTypeChange}
      />
    );

    // Check that radio buttons are rendered with correct values
    const startEndRadios = screen.getAllByLabelText('כניסה / יציאה');
    const durationRadios = screen.getAllByLabelText('סכום שעות');

    // First project should have startEnd selected
    expect(startEndRadios[0]).toBeChecked();
    expect(durationRadios[0]).not.toBeChecked();

    // Second project should have duration selected
    expect(durationRadios[1]).toBeChecked();
    expect(startEndRadios[1]).not.toBeChecked();
  });

  it('calls onReportingTypeChange when reporting type is changed', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const user = userEvent.setup();
    
    const onReportingTypeChange = vi.fn();
    render(
      <ReportingSettingsTable
        projects={mockProjects}
        onReportingTypeChange={onReportingTypeChange}
      />
    );

    // Find the duration radio for the first project and click it
    const durationRadios = screen.getAllByLabelText('סכום שעות');
    await user.click(durationRadios[0]);

    expect(onReportingTypeChange).toHaveBeenCalledWith(1, 'duration');
  });

  it('disables toggles when isUpdating is true', () => {
    const onReportingTypeChange = vi.fn();
    render(
      <ReportingSettingsTable
        projects={mockProjects}
        onReportingTypeChange={onReportingTypeChange}
        isUpdating={true}
      />
    );

    const allRadios = [
      ...screen.getAllByLabelText('כניסה / יציאה'),
      ...screen.getAllByLabelText('סכום שעות'),
    ];

    allRadios.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it('shows empty state when projects array is empty', () => {
    const onReportingTypeChange = vi.fn();
    render(
      <ReportingSettingsTable
        projects={[]}
        onReportingTypeChange={onReportingTypeChange}
      />
    );

    // Should still show headers
    expect(screen.getByText('שם לקוח')).toBeInTheDocument();
    expect(screen.getByText('שם פרויקט')).toBeInTheDocument();
    expect(screen.getByText('סוג הדיווח')).toBeInTheDocument();

    // Should show empty state message
    expect(screen.getByText('אין מידע קיים עד כה')).toBeInTheDocument();
  });

  it('does not show project rows when projects array is empty', () => {
    const onReportingTypeChange = vi.fn();
    render(
      <ReportingSettingsTable
        projects={[]}
        onReportingTypeChange={onReportingTypeChange}
      />
    );

    expect(screen.queryByText('Client 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Project 1')).not.toBeInTheDocument();
  });
});
