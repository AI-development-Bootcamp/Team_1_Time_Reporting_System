import { Table, Paper, Text, Box } from '@mantine/core';
import type { ProjectWithClient } from '../../hooks/useReportingSettings';
import type { ReportingType } from '../../types/Project';
import { ReportingTypeToggle } from './ReportingTypeToggle';

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
  return (
    <Paper shadow="xs" withBorder style={{ overflow: 'hidden' }}>
      <Table 
        striped 
        highlightOnHover
        verticalSpacing="md"
        horizontalSpacing="lg"
      >
        <Table.Thead style={{ backgroundColor: '#1e3a5f' }}>
          <Table.Tr>
            <Table.Th style={{ textAlign: 'right' }}>
              <Text fw={600} size="sm" c="white">שם לקוח</Text>
            </Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>
              <Text fw={600} size="sm" c="white">שם פרויקט</Text>
            </Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>
              <Text fw={600} size="sm" c="white">סוג הדיווח</Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        
        <Table.Tbody>
          {projects.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text ta="center" c="dimmed" py="xl">
                  לא נמצאו פרויקטים
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            projects.map((project) => (
              <Table.Tr key={project.id}>
                {/* Client Name */}
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="sm">{project.client.name}</Text>
                </Table.Td>
                
                {/* Project Name */}
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text size="sm">{project.name}</Text>
                </Table.Td>
                
                {/* Reporting Type Toggle */}
                <Table.Td style={{ textAlign: 'right' }}>
                  <Box>
                    <ReportingTypeToggle
                      value={project.reportingType}
                      onChange={(value) => onReportingTypeChange(project.id, value)}
                      disabled={isUpdating}
                    />
                  </Box>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
