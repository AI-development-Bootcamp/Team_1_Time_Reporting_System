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
      // Store token and user in context (which also saves to localStorage)
      login(data.token, data.user);
      // Redirect to appropriate page
      onSuccessRedirect();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status;
      const errorData = error.response?.data;

      if (status === 400 && errorData?.error?.details) {
        // 400 Validation errors - set field errors
        const details = errorData.error.details;
        
        if (details.mail) {
          form.setFieldError('mail', Array.isArray(details.mail) ? details.mail[0] : details.mail);
        }
        if (details.password) {
          form.setFieldError('password', Array.isArray(details.password) ? details.password[0] : details.password);
        }
      } else {
        // 401/409/500 Operational errors - show toast notification
        const message = errorData?.error?.message || 'שגיאה בהתחברות. נסה שוב.';
        notifications.show({
          title: 'שגיאה',
          message,
          color: 'red',
        });
      }
    },
  });
};
