import { Pagination, Group } from '@mantine/core';
import styles from './ReusablePagination.module.css';

interface ReusablePaginationProps {
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
 * Reusable pagination component with consistent styling
 * 
 * Features:
 * - Mantine Pagination component
 * - Page numbers with prev/next arrows
 * - First/Last page navigation buttons (double arrows)
 * - RTL layout support
 * - Gray background for active page
 */
export function ReusablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: ReusablePaginationProps) {
  return (
    <Group justify="center" mt="md" className={styles.paginationContainer}>
      <Pagination
        value={currentPage}
        onChange={onPageChange}
        total={totalPages}
        siblings={1}
        withEdges
        boundaries={1}
        classNames={{
          control: styles.paginationControl,
        }}
      />
    </Group>
  );
}

