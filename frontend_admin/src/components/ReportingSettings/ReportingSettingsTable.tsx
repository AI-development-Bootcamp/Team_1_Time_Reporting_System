import { Table, Paper, Text, Box, Image, Stack, Center } from '@mantine/core';
import type { ProjectWithClient } from '../../hooks/useReportingSettings';
import type { ReportingType } from '../../types/Project';
import { ReportingTypeToggle } from './ReportingTypeToggle';
import emptyListImage from '../../../../shared/image_components/web_empty_list.png';

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
        style={{
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          flex: 1,
          borderRadius: 8,
          borderWidth: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
        }}
      >
        <Table 
          striped 
          style={{ tableLayout: 'fixed' }}
          styles={{
            thead: {
              backgroundColor: '#141e3e',
            },
          }}
        >
          <Table.Thead>
            <Table.Tr style={{ height: 36 }}>
              <Table.Th style={{ textAlign: 'right', height: 36, padding: '6px 12px' }}>
                <Text 
                  fw={600} 
                  size="sm" 
                  c="white" 
                  style={{ fontFamily: 'SimplerPro, sans-serif' }}
                >
                  שם לקוח
                </Text>
              </Table.Th>
              <Table.Th
                style={{
                  textAlign: 'right',
                  height: 36,
                  padding: '6px 12px',
                  borderInlineStart: HEADER_COLUMN_BORDER,
                }}
              >
                <Text 
                  fw={600} 
                  size="sm" 
                  c="white" 
                  style={{ fontFamily: 'SimplerPro, sans-serif' }}
                >
                  שם פרויקט
                </Text>
              </Table.Th>
              <Table.Th
                style={{
                  textAlign: 'right',
                  height: 36,
                  padding: '6px 12px',
                  borderInlineStart: HEADER_COLUMN_BORDER,
                }}
              >
                <Text 
                  fw={600} 
                  size="sm" 
                  c="white" 
                  style={{ fontFamily: 'SimplerPro, sans-serif' }}
                >
                  סוג הדיווח
                </Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
        </Table>

        <Center style={{ flex: 1, padding: 24 }}>
          <Stack align="center" gap={16}>
            <Text 
              fw={700} 
              style={{ fontFamily: 'SimplerPro, sans-serif', fontSize: 18 }}
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
      style={{ 
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        flex: 1,
        borderRadius: 8,
        borderWidth: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Table 
          striped 
          style={{ tableLayout: 'fixed' }}
          styles={{
            thead: {
              backgroundColor: '#141e3e',
            },
          }}
        >
        <Table.Thead>
          <Table.Tr style={{ height: 36 }}>
            <Table.Th style={{ textAlign: 'right', height: 36, padding: '6px 12px' }}>
              <Text 
                fw={600} 
                size="sm" 
                c="white" 
                style={{ fontFamily: 'SimplerPro, sans-serif' }}
              >
                שם לקוח
              </Text>
            </Table.Th>
            <Table.Th
              style={{
                textAlign: 'right',
                height: 36,
                padding: '6px 12px',
                borderInlineStart: HEADER_COLUMN_BORDER,
              }}
            >
              <Text 
                fw={600} 
                size="sm" 
                c="white" 
                style={{ fontFamily: 'SimplerPro, sans-serif' }}
              >
                שם פרויקט
              </Text>
            </Table.Th>
            <Table.Th
              style={{
                textAlign: 'right',
                height: 36,
                padding: '6px 12px',
                borderInlineStart: HEADER_COLUMN_BORDER,
              }}
            >
              <Text 
                fw={600} 
                size="sm" 
                c="white" 
                style={{ fontFamily: 'SimplerPro, sans-serif' }}
              >
                סוג הדיווח
              </Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        
        <Table.Tbody>
          {projects.map((project) => (
            <Table.Tr key={project.id} style={{ height: 48 }}>
              {/* Client Name */}
              <Table.Td style={{ textAlign: 'right', height: 48, padding: '6px 12px' }}>
                <Text size="sm" style={{ fontFamily: 'SimplerPro, sans-serif' }}>
                  {project.client.name}
                </Text>
              </Table.Td>

              {/* Project Name */}
              <Table.Td
                style={{
                  textAlign: 'right',
                  height: 48,
                  padding: '6px 12px',
                  borderInlineStart: BODY_COLUMN_BORDER,
                }}
              >
                <Text size="sm" style={{ fontFamily: 'SimplerPro, sans-serif' }}>
                  {project.name}
                </Text>
              </Table.Td>

              {/* Reporting Type Toggle */}
              <Table.Td
                style={{
                  textAlign: 'right',
                  height: 48,
                  padding: '6px 12px',
                  borderInlineStart: BODY_COLUMN_BORDER,
                }}
              >
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
