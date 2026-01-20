import { ReactNode } from 'react';
import { Box } from '@mantine/core';
import '../../styles/components/AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Box className="app-layout">
      {/* Main Content Area */}
      <Box className="app-layout-content">
        <Box className="app-layout-content-inner">
          {children}
        </Box>
      </Box>

      {/* Sidebar on the right (RTL layout) - 320px fixed width, color #141E3E */}
      <Box className="app-layout-sidebar" />
    </Box>
  );
}

