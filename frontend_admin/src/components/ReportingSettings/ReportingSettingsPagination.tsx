import { Pagination, Center } from '@mantine/core';
import styles from './ReportingSettingsPagination.module.css';

interface ReportingSettingsPaginationProps {
  /**
   * Current active page (1-indexed)
   */
  currentPage: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
  
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for Reporting Settings table
 * 
 * Features:
 * - Mantine Pagination component
 * - Fixed items per page (10)
 * - Page numbers with prev/next arrows
 * - First/Last page navigation buttons (double arrows)
 * - RTL layout support (arrows direction automatically handled by Mantine)
 */
export function ReportingSettingsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ReportingSettingsPaginationProps) {
  return (
    <Center className={styles.paginationCenter}>
      <Pagination
        value={currentPage}
        onChange={onPageChange}
        total={totalPages}
        siblings={1}
        boundaries={1}
        withEdges
        size="sm"
        styles={{
          control: {
            fontFamily: 'SimplerPro, sans-serif',
          },
        }}
      />
    </Center>
  );
}
