import { AppShell, NavLink, Text, Group, Box } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Main application layout with sidebar navigation
 * 
 * Features:
 * - AppShell with dark blue navbar (like the design)
 * - RTL support
 * - Navigation menu items with icons
 * - Active route highlighting
 */
export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell
      navbar={{
        width: 250,
        breakpoint: 'sm',
      }}
      padding="md"
    >
      <AppShell.Navbar 
        p="md" 
        style={{ 
          backgroundColor: '#1e3a5f',
          borderLeft: 'none',
        }}
      >
        {/* Logo / Brand */}
        <AppShell.Section mb="lg">
          <Group justify="flex-end" p="sm">
            <Text size="xl" fw={700} c="white">abra</Text>
            <Box 
              style={{ 
                width: 8, 
                height: 8, 
                backgroundColor: '#ff6b35', 
                borderRadius: '50%' 
              }} 
            />
          </Group>
        </AppShell.Section>

        <AppShell.Section grow>
          {/* Home / Dashboard */}
          <NavLink
            label="ניהול ללקוחות/פרויקטים"
            leftSection="📋"
            onClick={() => navigate('/')}
            active={location.pathname === '/'}
            styles={{
              root: {
                borderRadius: 8,
                marginBottom: 4,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
                '&[data-active]': {
                  backgroundColor: '#2e5a8f',
                  color: 'white',
                },
              },
              label: {
                color: 'white',
                textAlign: 'right',
              },
            }}
          />

          {/* Reporting Settings */}
          <NavLink
            label="הגדרת דיווחי שעות"
            leftSection="⏰"
            onClick={() => navigate('/settings/reporting')}
            active={location.pathname === '/settings/reporting'}
            styles={{
              root: {
                borderRadius: 8,
                marginBottom: 4,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
                '&[data-active]': {
                  backgroundColor: '#2e5a8f',
                  color: 'white',
                },
              },
              label: {
                color: 'white',
                textAlign: 'right',
              },
            }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main style={{ backgroundColor: '#f5f5f5' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
