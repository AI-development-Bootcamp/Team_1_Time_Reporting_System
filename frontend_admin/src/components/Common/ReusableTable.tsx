import { Table, Paper, Text, Box, Center, Stack, Image } from '@mantine/core';
import { ReactNode } from 'react';
import emptyListImage from '../../../../shared/image_components/web_empty_list.png';
import styles from './ReusableTable.module.css';

interface Column {
  label: string;
  align?: 'left' | 'right' | 'center';
}

interface ReusableTableProps {
  /**
   * Column definitions for the table header
   */
  columns: Column[];
  
  /**
   * Table body rows (ReactNode array)
   */
  children: ReactNode;
  
  /**
   * Whether the table is empty
   */
  isEmpty?: boolean;
  
  /**
   * Empty state message (optional, defaults to Hebrew message)
   */
  emptyMessage?: string;
}

/**
 * Reusable table component with consistent styling
 * 
 * Features:
 * - Paper wrapper with shadow and border
 * - Dark blue header (#141e3e)
 * - RTL support for Hebrew
 * - Empty state with image
 * - Consistent cell styling
 */
export function ReusableTable({
  columns,
  children,
  isEmpty = false,
  emptyMessage = 'אין מידע קיים עד כה',
}: ReusableTableProps) {
  return (
    <Paper 
      shadow="xs" 
      withBorder 
      className={styles.paper}
    >
      {isEmpty ? (
        <>
          <Table 
            striped 
            className={styles.table}
          >
            <Table.Thead>
              <Table.Tr className={styles.tableRow}>
                {columns.map((column, index) => (
                  <Table.Th 
                    key={index}
                    className={index === 0 ? styles.tableHeader : styles.tableHeaderWithBorder}
                    style={{ textAlign: column.align || 'right' }}
                  >
                    <Text 
                      fw={600} 
                      size="sm" 
                      c="white" 
                      className={styles.tableText}
                    >
                      {column.label}
                    </Text>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
          </Table>

          <Center className={styles.emptyStateCenter}>
            <Stack align="center" gap={16}>
              <Text 
                fw={700} 
                className={styles.emptyStateText}
              >
                {emptyMessage}
              </Text>
              <Image src={emptyListImage} alt="אין מידע" w={420} fit="contain" />
            </Stack>
          </Center>
        </>
      ) : (
        <Box className={styles.tableContentBox}>
          <Table 
            striped 
            className={styles.table}
          >
            <Table.Thead>
              <Table.Tr className={styles.tableRow}>
                {columns.map((column, index) => (
                  <Table.Th 
                    key={index}
                    className={index === 0 ? styles.tableHeader : styles.tableHeaderWithBorder}
                    style={{ textAlign: column.align || 'right' }}
                  >
                    <Text 
                      fw={600} 
                      size="sm" 
                      c="white" 
                      className={styles.tableText}
                    >
                      {column.label}
                    </Text>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            
            <Table.Tbody>
              {children}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Paper>
  );
}

