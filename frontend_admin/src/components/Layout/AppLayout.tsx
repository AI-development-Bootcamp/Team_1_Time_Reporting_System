import { AppShell, NavLink, Group, Box, Image, Text } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import abraLogo from '../../../../shared/image_components/abraLogo_inverted.png';
import bottomLogo from '../../../../shared/image_components/bottom_logo.png';
import { useAuth } from '../../hooks/useAuth';

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
        style={{
          backgroundColor: '#141e3e',
          borderRight: 'none',
          right: 0,
          height: '100vh',
          justifyContent: 'space-between',
          paddingTop: 24,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 16,
        }}
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
              style={{ opacity: 1 }}
            />
          </Group>
        </AppShell.Section>

        <AppShell.Section grow>
          {/* Home / Dashboard */}
          <NavLink
            label="ניהול לקוחות/פרויקטים"
            rightSection={
              <Box 
                style={{ 
                  width: 20, 
                  height: 20, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                📋
              </Box>
            }
            onClick={() => navigate('/')}
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
              <Box 
                style={{ 
                  width: 20, 
                  height: 20, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
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
          <Box
            style={{
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
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
              style={{ 
                fontFamily: 'SimplerPro, sans-serif',
                textAlign: 'right',
                flex: 1,
              }}
            >
              {user?.name || 'Admin'}
            </Text>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main 
        style={{ 
          backgroundColor: '#f5f5f5',
          marginRight: 0,
          marginLeft: 0,
          height: '100vh',
          maxHeight: 1080,
          overflow: 'hidden',
        }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
