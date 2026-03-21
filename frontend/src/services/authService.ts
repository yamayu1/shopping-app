import { apiClient } from './api';
import {
  User,
  AuthUser,
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  ApiResponse,
} from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { setToStorage, removeFromStorage } from '../utils/helpers';

const splitName = (name?: string) => {
  const parts = name?.split(' ') || [];
  return {
    lastName: parts[0] || '',
    firstName: parts.slice(1).join(' ') || '',
  };
};

// APIのレスポンス形式とフロント側の型が違うので変換する
const toAuthUser = (apiResponse: any): AuthUser => {
  const apiData = apiResponse.data?.user;
  const token = apiResponse.data?.token;

  const user: AuthUser = {
    token: token,
    id: apiData.id,
    email: apiData.email,
    first_name: apiData.first_name || '',
    last_name: apiData.last_name || '',
    phone: apiData.phone || '',
    role: apiData.role || 'user',
    is_active: true,
    created_at: apiData.created_at || new Date().toISOString(),
    updated_at: apiData.updated_at || new Date().toISOString(),
  };

  setToStorage(STORAGE_KEYS.AUTH_TOKEN, user.token);
  setToStorage(STORAGE_KEYS.USER_DATA, user);

  return user;
};

export const authService = {
  login: async (credentials: LoginForm): Promise<AuthUser> => {
    const response = await apiClient.post<any>('/auth/login', credentials);
    return response ? toAuthUser(response) : response;
  },

  register: async (userData: RegisterForm): Promise<AuthUser> => {
    const response = await apiClient.post<any>('/auth/register', userData);
    return response ? toAuthUser(response) : response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('ログアウトAPIエラー:', error);
    } finally {
      removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
      removeFromStorage(STORAGE_KEYS.USER_DATA);
      removeFromStorage(STORAGE_KEYS.CART_DATA);
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<any>('/auth/profile');
    return response.data?.user;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<any>('/auth/profile', userData);

    if (response) {
      const apiData = response.data?.user;

      const transformedData: User = {
        id: apiData.id,
        email: apiData.email,
        first_name: apiData.first_name || '',
        last_name: apiData.last_name || '',
        phone: apiData.phone || '',
        role: apiData.role || 'user',
        is_active: true,
        created_at: apiData.created_at || new Date().toISOString(),
        updated_at: apiData.updated_at || new Date().toISOString(),
      };

      const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
      setToStorage(STORAGE_KEYS.USER_DATA, { ...currentUser, ...transformedData });

      return transformedData;
    }

    return response;
  },

  forgotPassword: async (data: ForgotPasswordForm): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/forgot_password', data);
  },

  resetPassword: async (data: ResetPasswordForm): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/reset_password', data);
  },

  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/verify-email', { token });
  },

  resendVerificationEmail: async (): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/resend-verification');
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/change-password', data);
  },

  refreshToken: async (): Promise<AuthUser> => {
    const response = await apiClient.post<any>('/auth/refresh');
    return response ? toAuthUser(response) : response;
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  },

  getStoredUser: (): User | null => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  getStoredToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};
