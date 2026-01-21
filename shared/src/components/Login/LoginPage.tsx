import { useState } from 'react';
import { Container, TextInput, PasswordInput, Button, Box, Image, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useLogin';
import { LoginRequest } from '../../types/User';

// Image paths using relative paths from shared/src/components/Login/
// Component is at: shared/src/components/Login/LoginPage.tsx
// Images are at: shared/image_components/
// Need to go up 3 levels: ../../../
const abraLogo = new URL('../../../image_components/abraLogo.png', import.meta.url).href;
const logInBackground = new URL('../../../image_components/log_in_backround.png', import.meta.url).href;
const loginMobile = new URL('../../../image_components/login_mobile.png', import.meta.url).href;

interface LoginPageProps {
  appType: 'user' | 'admin';
}

export const LoginPage = ({ appType }: LoginPageProps) => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<LoginRequest>({
    initialValues: {
      mail: '',
      password: '',
    },
    validate: {
      // Only validate presence - let backend validate format to show notification errors
      mail: (value) => (!value ? 'כתובת אימייל נדרשת' : null),
      password: (value) => (!value ? 'סיסמה נדרשת' : null),
    },
  });

  const loginMutation = useLogin({
    form,
    onSuccessRedirect: () => {
      if (appType === 'user') {
        navigate('/month-history');
      } else {
        navigate('/client-management');
      }
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    loginMutation.mutate(values);
  });

  const handleButtonClick = () => {
    setShowForm(true);
  };

  // Determine images based on appType
  const backgroundImage = logInBackground; // Both admin and user use log_in_backround.png

  return (
    <Box
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Container size="sm" style={{ width: '100%', maxWidth: appType === 'admin' ? 500 : 400 }}>
        {appType === 'user' ? (
          // User app: Display login_mobile.png as the login component, then button below
          <Box
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 30,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              width: '100%',
            }}
          >
            <Stack gap="md" align="center">
              <Image 
                src={loginMobile} 
                alt="Login Mobile" 
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  borderRadius: 12,
                }} 
              />
              
              {!showForm ? (
                <Button
                  onClick={handleButtonClick}
                  fullWidth
                  size="lg"
                  style={{ 
                    marginTop: 20,
                    backgroundColor: '#141e3e',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a2b53';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#141e3e';
                  }}
                >
                  התחברות
                </Button>
              ) : (
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <Stack gap="md">
                    <TextInput
                      label="כתובת אימייל"
                      placeholder="הכנס כתובת אימייל"
                      required
                      {...form.getInputProps('mail')}
                    />

                    <PasswordInput
                      label="סיסמה"
                      placeholder="הכנס סיסמה"
                      required
                      {...form.getInputProps('password')}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      loading={loginMutation.isPending}
                      style={{ 
                        marginTop: 20,
                        backgroundColor: '#141e3e',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a2b53';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#141e3e';
                      }}
                    >
                      התחברות
                    </Button>
                  </Stack>
                </form>
              )}
            </Stack>
          </Box>
        ) : (
          // Admin app: Keep existing design
          <Box
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 40,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Stack gap="md" align="center">
              {/* Abra Logo on top */}
              <Image src={abraLogo} alt="Abra Logo" style={{ maxWidth: 120, marginBottom: 10 }} />

              {/* Welcome description with waving emoji */}
              <Text size="lg" fw={500} style={{ textAlign: 'center', marginBottom: 20 }}>
                ברוכים הבאים למערכת הניהול של אברא 👋
              </Text>

              {!showForm ? (
                <Button
                  onClick={handleButtonClick}
                  fullWidth
                  size="lg"
                  style={{ 
                    marginTop: 20,
                    backgroundColor: '#141e3e',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a2b53';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#141e3e';
                  }}
                >
                  התחברות
                </Button>
              ) : (
                <>
                  <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <Stack gap="md">
                      <TextInput
                        label="כתובת אימייל"
                        placeholder="הכנס כתובת אימייל"
                        required
                        {...form.getInputProps('mail')}
                      />

                      <PasswordInput
                        label="סיסמה"
                        placeholder="הכנס סיסמה"
                        required
                        {...form.getInputProps('password')}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        loading={loginMutation.isPending}
                        style={{ 
                          marginTop: 20,
                          backgroundColor: '#141e3e',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1a2b53';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#141e3e';
                        }}
                      >
                        התחברות
                      </Button>
                    </Stack>
                  </form>
                </>
              )}
            </Stack>
          </Box>
        )}
      </Container>
    </Box>
  );
};
