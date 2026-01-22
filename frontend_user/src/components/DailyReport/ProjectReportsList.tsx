/**
 * ProjectReportsList Component
 * List of project reports with add button
 * 
 * Features:
 * - Display list of ProjectReportCard components
 * - "הוספת פרויקט" button with + icon
 * - Empty state handling
 * - Mobile-first, RTL design
 */

import { Stack, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { ProjectReportItem, TaskLookupMap } from '../../types';
import classes from './ProjectReportsList.module.css';

interface ProjectReportsListProps {
  /** Array of project reports */
  reports: ProjectReportItem[];
  /** Callback when "הוספת פרויקט" is clicked */
  onAdd: () => void;
  /** Callback when a report is edited */
  onEdit: (index: number, updatedReport: ProjectReportItem) => void;
  /** Callback when a report is deleted */
  onDelete: (index: number) => void;
  /** Task lookup map for project/task metadata */
  taskLookup: TaskLookupMap;
}

/**
 * ProjectReportsList - List of project time logs
 * 
 * @example
 * <ProjectReportsList
 *   reports={formData.projectReports}
 *   onAdd={() => addProjectReport()}
 *   onEdit={(index, report) => updateProjectReport(index, report)}
 *   onDelete={(index) => removeProjectReport(index)}
 *   taskLookup={taskLookup}
 * />
 */
export function ProjectReportsList({
  reports,
  onAdd,
  onEdit,
  onDelete,
  taskLookup,
}: ProjectReportsListProps) {
  const hasReports = reports.length > 0;

  return (
    <div className={classes.container}>
      <Stack gap="md">
        {/* Section Title */}
        <div className={classes.header}>
          <Text size="md" fw={600}>
            דיווח פרויקטים
          </Text>
          {hasReports && (
            <Text size="sm" c="dimmed">
              ({reports.length})
            </Text>
          )}
        </div>

        {/* Reports List */}
        {hasReports ? (
          <div className={classes.reportsList}>
            {reports.map((report, index) => (
              <div key={index} className={classes.reportCard}>
                {/* TODO: Replace with ProjectReportCard component (TASK-M2-020-FE-015) */}
                <div className={classes.placeholder}>
                  <Text size="sm" fw={500}>
                    פרויקט #{index + 1}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {report.projectName || 'לא נבחר'}
                  </Text>
                  {report.duration !== undefined && (
                    <Text size="xs" c="dimmed">
                      משך: {Math.floor(report.duration / 60)}:{(report.duration % 60).toString().padStart(2, '0')} שעות
                    </Text>
                  )}
                  {report.startTime && report.endTime && (
                    <Text size="xs" c="dimmed">
                      {report.startTime} - {report.endTime}
                    </Text>
                  )}
                  <div className={classes.placeholderActions}>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => onEdit(index, report)}
                    >
                      עריכה
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => onDelete(index)}
                    >
                      מחיקה
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className={classes.emptyState}>
            <Text size="sm" c="dimmed" ta="center">
              לחץ על "הוספת פרויקט" להתחיל לדווח
            </Text>
          </div>
        )}

        {/* Add Project Button */}
        <Button
          variant="subtle"
          color="blue"
          leftSection={<IconPlus size={16} />}
          onClick={onAdd}
          className={classes.addButton}
        >
          הוספת פרויקט
        </Button>
      </Stack>
    </div>
  );
}
