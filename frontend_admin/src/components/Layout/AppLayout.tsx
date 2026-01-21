import { ReactNode } from 'react';
import { Box } from '@mantine/core';
import styles from '../../styles/components/AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box className={styles.appLayout}>
      {/* Main Content Area */}
      <Box className={styles.appLayoutContent}>
        <Box className={styles.appLayoutContentInner}>
          {children}
        </Box>
      </Box>

      {/* Sidebar on the right (RTL layout) - 320px fixed width, color #141E3E */}
      <Box className={styles.appLayoutSidebar} />
    </Box>
  );
}

