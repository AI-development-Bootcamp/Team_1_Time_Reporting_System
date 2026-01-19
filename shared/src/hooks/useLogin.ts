import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiClient } from '../utils/ApiClient';
import { useAuth } from './useAuth';
import { LoginRequest, LoginResponse } from '../types/User';
import { UseFormReturnType } from '@mantine/form';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '../utils/ApiClient';

interface UseLoginOptions {
  form: UseFormReturnType<LoginRequest>;
  onSuccessRedirect: () => void;
}

export const useLogin = ({ form, onSuccessRedirect }: UseLoginOptions) => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<LoginResponse> => {
      const response = await apiClient.post<LoginResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store token and decode user data locally (no API call needed)
      login(data.token);
      // Redirect to appropriate page
      onSuccessRedirect();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status;
      const errorData = error.response?.data;

      if (status === 400 && errorData?.error?.details) {
        // 400 Validation errors - set field errors AND show notification
        const details = errorData.error.details;
        
        // Set field errors
        if (details.mail) {
          form.setFieldError('mail', Array.isArray(details.mail) ? details.mail[0] : details.mail);
        }
        if (details.password) {
          form.setFieldError('password', Array.isArray(details.password) ? details.password[0] : details.password);
        }
        
        // Also show notification for validation errors
        // Extract specific error message from details if available
        let validationMessage = errorData?.error?.message || 'פרטי ההתחברות שגויים. אנא בדוק את השדות.';
        
        // If details exist, try to extract a more specific message
        if (details && typeof details === 'object') {
          const detailMessages: string[] = [];
          
          // Handle Zod error format (array of error objects)
          if (Array.isArray(details)) {
            details.forEach((err: any) => {
              if (err.path && err.message) {
                const field = err.path[0] || 'field';
                detailMessages.push(`${field}: ${err.message}`);
              }
            });
          } else {
            // Handle object format
            Object.keys(details).forEach((key) => {
              const fieldError = details[key];
              if (Array.isArray(fieldError)) {
                detailMessages.push(fieldError[0]);
              } else if (typeof fieldError === 'string') {
                detailMessages.push(fieldError);
              }
            });
          }
          
          if (detailMessages.length > 0) {
            validationMessage = detailMessages[0]; // Use first error message
          }
        }
        
        notifications.show({
          id: 'login-validation-error',
          title: 'שגיאת אימות',
          message: validationMessage,
          color: 'red',
          autoClose: 6000,
          withCloseButton: true,
          style: {
            zIndex: 10001,
          },
        });
      } else {
        // 401/409/500 Operational errors - show toast notification
        const message = errorData?.error?.message || 'שגיאה בהתחברות. נסה שוב.';
        notifications.show({
          id: 'login-error', // Prevent duplicate notifications
          title: 'שגיאה',
          message,
          color: 'red',
          autoClose: 6000, // Show for 6 seconds
          withCloseButton: true, // Allow manual close
          style: {
            zIndex: 10001, // Ensure it's above everything
          },
        });
      }
    },
  });
};
