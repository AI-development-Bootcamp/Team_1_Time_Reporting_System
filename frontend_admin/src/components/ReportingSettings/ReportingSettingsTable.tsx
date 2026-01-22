import { Table, Text, Box } from '@mantine/core';
import type { ProjectWithClient } from '../../hooks/useReportingSettings';
import type { ReportingType } from '../../types/Project';
import { ReportingTypeToggle } from './ReportingTypeToggle';
import { ReusableTable } from '../Common/ReusableTable';
import styles from '../Common/ReusableTable.module.css';

interface ReportingSettingsTableProps {
  /**
   * Array of projects with client data
   */
  projects: ProjectWithClient[];

  /**
   * Callback when reporting type changes
   */
  onReportingTypeChange: (projectId: number, reportingType: ReportingType) => void;

  /**
   * Whether any update is in progress
   */
  isUpdating?: boolean;
}

/**
 * Table component for displaying and managing project reporting settings
 * 
 * Features:
 * - RTL support for Hebrew (right-aligned text)
 * - Dark blue header background
 * - Three columns: Client Name, Project Name, Reporting Type
 * - Radio button toggle for each project
 * - Client data joined from Project → Client
 */
export function ReportingSettingsTable({
  projects,
  onReportingTypeChange,
  isUpdating = false,
}: ReportingSettingsTableProps) {
  const columns = [
    { label: 'שם לקוח' },
    { label: 'שם פרויקט' },
    { label: 'סוג הדיווח' },
  ];

  return (
    <ReusableTable
      columns={columns}
      isEmpty={projects.length === 0}
    >
      {projects.map((project) => (
        <Table.Tr key={project.id} className={styles.tableBodyRow}>
          <Table.Td className={styles.tableCell}>
            <Text size="sm" className={styles.tableText}>
              {project.client.name}
            </Text>
          </Table.Td>
          <Table.Td className={styles.tableCellWithBorder}>
            <Text size="sm" className={styles.tableText}>
              {project.name}
            </Text>
          </Table.Td>
          <Table.Td className={styles.tableCellWithBorder}>
            <Box>
              <ReportingTypeToggle
                value={project.reportingType}
                onChange={(value) => onReportingTypeChange(Number(project.id), value)}
                disabled={isUpdating}
              />
            </Box>
          </Table.Td>
        </Table.Tr>
      ))}
    </ReusableTable>
  );
}
