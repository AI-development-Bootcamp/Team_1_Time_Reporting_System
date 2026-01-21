import { useState } from 'react';
import { Container, TextInput, PasswordInput, Button, Box, Image, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useLogin';
import { LoginRequest } from '../../types/User';
import styles from './LoginPage.module.css';

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
      className={styles.pageContainer}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Container size="sm" style={{ width: '100%', maxWidth: appType === 'admin' ? 500 : 400 }}>
        {appType === 'user' ? (
          // User app: Display login_mobile.png as the login component, then button below
          <Box className={styles.card}>
            <Stack gap="md" align="center">
              <Image
                src={loginMobile}
                alt="Login Mobile"
                className={styles.loginImage}
              />

              {!showForm ? (
                <Button
                  onClick={handleButtonClick}
                  fullWidth
                  size="lg"
                  className={styles.primaryButton}
                >
                  התחברות
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
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
                      className={styles.primaryButton}
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
          <Box className={styles.cardAdmin}>
            <Stack gap="md" align="center">
              {/* Abra Logo on top */}
              <Image src={abraLogo} alt="Abra Logo" className={styles.logo} />

              {/* Welcome description with waving emoji */}
              <Text size="lg" fw={500} className={styles.welcomeText}>
                ברוכים הבאים למערכת הניהול של אברא 👋
              </Text>

              {!showForm ? (
                <Button
                  onClick={handleButtonClick}
                  fullWidth
                  size="lg"
                  className={styles.primaryButton}
                >
                  התחברות
                </Button>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className={styles.form}>
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
                        className={styles.primaryButton}
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

