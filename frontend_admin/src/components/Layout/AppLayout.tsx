import { AppShell, NavLink, Group, Box, Image, Text } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { IconUsers, IconClock } from '@tabler/icons-react';
import abraLogo from '../../../../shared/image_components/abraLogo_inverted.png';
import bottomLogo from '../../../../shared/image_components/bottom_logo.png';
import { useAuth } from '@shared/hooks/useAuth';
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

  const isClientManagement =
    location.pathname === '/client-management' || location.pathname === '/';
  const isReportingSettings = location.pathname === '/client-management/reporting-setting';

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
                <IconUsers size={20} stroke={1.5} />
              </Box>
            }
            onClick={() => navigate('/client-management')}
            active={isClientManagement && !isReportingSettings}
            className={isClientManagement && !isReportingSettings ? styles.activeNavItem : ''}
            styles={{
              root: {
                borderRadius: 8,
                marginBottom: 4,
                color: 'white',
                fontFamily: 'SimplerPro, sans-serif',
                backgroundColor: 'transparent',
                position: 'relative',
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
                <IconClock size={20} stroke={1.5} />
              </Box>
            }
            onClick={() => navigate('/client-management/reporting-setting')}
            active={isReportingSettings}
            className={isReportingSettings ? styles.activeNavItem : ''}
            styles={{
              root: {
                borderRadius: 8,
                marginBottom: 4,
                color: 'white',
                fontFamily: 'SimplerPro, sans-serif',
                backgroundColor: 'transparent',
                position: 'relative',
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
