import { Table, Paper, Text, Box, Image, Stack, Center } from '@mantine/core';
import type { ProjectWithClient } from '../../hooks/useReportingSettings';
import type { ReportingType } from '../../types/Project';
import { ReportingTypeToggle } from './ReportingTypeToggle';
import emptyListImage from '../../../../shared/image_components/web_empty_list.png';
import styles from './ReportingSettingsTable.module.css';

const BODY_COLUMN_BORDER = '1px solid #e9ecef';
const HEADER_COLUMN_BORDER = '1px solid rgba(255, 255, 255, 0.18)';

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
  if (projects.length === 0) {
    return (
      <Paper
        shadow="xs"
        withBorder
        className={styles.paper}
      >
        <Table 
          striped 
          className={styles.table}
          styles={{
            thead: {
              backgroundColor: '#141e3e',
            },
          }}
        >
          <Table.Thead>
            <Table.Tr className={styles.tableRow}>
              <Table.Th className={styles.tableHeader}>
                <Text 
                  fw={600} 
                  size="sm" 
                  c="white" 
                  className={styles.tableText}
                >
                  שם לקוח
                </Text>
              </Table.Th>
              <Table.Th className={styles.tableHeaderWithBorder}>
                <Text 
                  fw={600} 
                  size="sm" 
                  c="white" 
                  className={styles.tableText}
                >
                  שם פרויקט
                </Text>
              </Table.Th>
              <Table.Th className={styles.tableHeaderWithBorder}>
                <Text 
                  fw={600} 
                  size="sm" 
                  c="white" 
                  className={styles.tableText}
                >
                  סוג הדיווח
                </Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
        </Table>

        <Center className={styles.emptyStateCenter}>
          <Stack align="center" gap={16}>
            <Text 
              fw={700} 
              className={styles.emptyStateText}
            >
              אין מידע קיים עד כה
            </Text>
            <Image src={emptyListImage} alt="אין מידע" w={420} fit="contain" />
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper 
      shadow="xs" 
      withBorder 
      className={styles.paper}
    >
      <Box className={styles.tableContentBox}>
        <Table 
          striped 
          className={styles.table}
          styles={{
            thead: {
              backgroundColor: '#141e3e',
            },
          }}
        >
        <Table.Thead>
          <Table.Tr className={styles.tableRow}>
            <Table.Th className={styles.tableHeader}>
              <Text 
                fw={600} 
                size="sm" 
                c="white" 
                className={styles.tableText}
              >
                שם לקוח
              </Text>
            </Table.Th>
            <Table.Th className={styles.tableHeaderWithBorder}>
              <Text 
                fw={600} 
                size="sm" 
                c="white" 
                className={styles.tableText}
              >
                שם פרויקט
              </Text>
            </Table.Th>
            <Table.Th className={styles.tableHeaderWithBorder}>
              <Text 
                fw={600} 
                size="sm" 
                c="white" 
                className={styles.tableText}
              >
                סוג הדיווח
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        
        <Table.Tbody>
          {projects.map((project) => (
            <Table.Tr key={project.id} className={styles.tableBodyRow}>
              {/* Client Name */}
              <Table.Td className={styles.tableCell}>
                <Text size="sm" className={styles.tableText}>
                  {project.client.name}
                </Text>
              </Table.Td>

              {/* Project Name */}
              <Table.Td className={styles.tableCellWithBorder}>
                <Text size="sm" className={styles.tableText}>
                  {project.name}
                </Text>
              </Table.Td>

              {/* Reporting Type Toggle */}
              <Table.Td className={styles.tableCellWithBorder}>
                <Box>
                  <ReportingTypeToggle
                    value={project.reportingType}
                    onChange={(value) => onReportingTypeChange(project.id, value)}
                    disabled={isUpdating}
                  />
                </Box>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
}
