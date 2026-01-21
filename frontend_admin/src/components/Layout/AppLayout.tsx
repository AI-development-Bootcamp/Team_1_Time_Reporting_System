import { AppShell, NavLink, Group, Box, Image, Text } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import abraLogo from '../../../../shared/image_components/abraLogo_inverted.png';
import bottomLogo from '../../../../shared/image_components/bottom_logo.png';
import { useAuth } from '../../hooks/useAuth';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Main application layout with sidebar navigation
 * 
 * Features:
 * - AppShell with dark blue navbar positioned on the right (RTL)
 * - Navigation menu items with icons
 * - Active route highlighting
 * - Abra logo in sidebar
 * - Dynamic admin name from localStorage (via useAuth hook)
 */
export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AppShell
      navbar={{
        width: 280,
        breakpoint: 'sm',
      }}
      padding={0}
      dir="rtl"
    >
      <AppShell.Navbar 
        className={styles.navbar}
      >
        {/* Logo / Brand */}
        <AppShell.Section mb="lg">
          <Group justify="center" p="sm">
            <Image
              src={abraLogo}
              alt="Abra Logo"
              w={106.18}
              h={24}
              fit="contain"
              className={styles.logoImage}
            />
          </Group>
        </AppShell.Section>

        <AppShell.Section grow>
          {/* Home / Dashboard */}
          <NavLink
            label="ניהול לקוחות/פרויקטים"
            rightSection={
              <Box className={styles.iconBox}>
                📋
              </Box>
            }
            onClick={() => navigate('/client-management')}
            active={location.pathname === '/'}
            styles={{
              root: {
                borderRadius: 8,
                marginBottom: 4,
                color: 'white',
                fontFamily: 'SimplerPro, sans-serif',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: '#4a6fa5 !important',
                },
              },
              label: {
                color: 'white',
                textAlign: 'right',
                fontFamily: 'SimplerPro, sans-serif',
              },
            }}
          />

          {/* Reporting Settings */}
          <NavLink
            label="הגדרת דיווחי שעות"
            rightSection={
              <Box className={styles.iconBox}>
                ⏰
              </Box>
            }
            onClick={() => navigate('/client-management/reporting-setting')}
            active={location.pathname === '/client-management/reporting-setting'}
            styles={{
              root: {
                borderRadius: 8,
                marginBottom: 4,
                color: 'white',
                fontFamily: 'SimplerPro, sans-serif',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: '#4a6fa5 !important',
                },
              },
              label: {
                color: 'white',
                textAlign: 'right',
                fontFamily: 'SimplerPro, sans-serif',
              },
            }}
          />
        </AppShell.Section>

        {/* Admin Profile Section */}
        <AppShell.Section>
          <Box className={styles.profileBox}>
            <Image
              src={bottomLogo}
              alt="Profile"
              w={40}
              h={40}
              fit="contain"
            />
            <Text
              size="sm"
              fw={600}
              c="white"
              className={styles.profileText}
            >
              {user?.name || 'Admin'}
            </Text>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main className={styles.main}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
