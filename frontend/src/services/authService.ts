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

export const authService = {
  // ユーザーログイン
  login: async (credentials: LoginForm): Promise<AuthUser> => {
    const response = await apiClient.post<any>('/auth/login', credentials);

    if (response) {
      // APIレスポンスをUser型に変換
      const apiData = response;
      const nameParts = apiData.name?.split(' ') || [];
      const lastName = nameParts[0] || '';
      const firstName = nameParts.slice(1).join(' ') || '';

      const transformedData: AuthUser = {
        token: apiData.token,
        id: apiData.id,
        email: apiData.email,
        first_name: firstName,
        last_name: lastName,
        phone: apiData.phone || '',
        role: apiData.role || 'user',
        is_active: true,
        created_at: apiData.created_at || new Date().toISOString(),
        updated_at: apiData.updated_at || new Date().toISOString(),
      };

      // 認証トークンとユーザーデータを保存
      setToStorage(STORAGE_KEYS.AUTH_TOKEN, transformedData.token);
      setToStorage(STORAGE_KEYS.USER_DATA, transformedData);

      return transformedData;
    }

    return response;
  },

  // 新規ユーザー登録
  register: async (userData: RegisterForm): Promise<AuthUser> => {
    const response = await apiClient.post<any>('/auth/register', userData);

    if (response) {
      // APIレスポンスをUser型に変換
      const apiData = response;
      const nameParts = apiData.name?.split(' ') || [];
      const lastName = nameParts[0] || '';
      const firstName = nameParts.slice(1).join(' ') || '';

      const transformedData: AuthUser = {
        token: apiData.token,
        id: apiData.id,
        email: apiData.email,
        first_name: firstName,
        last_name: lastName,
        phone: apiData.phone || '',
        role: apiData.role || 'user',
        is_active: true,
        created_at: apiData.created_at || new Date().toISOString(),
        updated_at: apiData.updated_at || new Date().toISOString(),
      };

      // 認証トークンとユーザーデータを保存
      setToStorage(STORAGE_KEYS.AUTH_TOKEN, transformedData.token);
      setToStorage(STORAGE_KEYS.USER_DATA, transformedData);

      return transformedData;
    }

    return response;
  },

  // ログアウト
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // API呼び出しが失敗してもログアウト処理を続行
      console.error('Logout API call failed:', error);
    } finally {
      // ローカルストレージを必ずクリア
      removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
      removeFromStorage(STORAGE_KEYS.USER_DATA);
      removeFromStorage(STORAGE_KEYS.CART_DATA);
    }
  },

  // 現在のユーザープロフィールを取得
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  // ユーザープロフィールを更新
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<any>('/auth/profile', userData);

    if (response) {
      // APIレスポンスをUser型に変換
      const apiData = response;
      const nameParts = apiData.name?.split(' ') || [];
      const lastName = nameParts[0] || apiData.last_name || '';
      const firstName = nameParts.slice(1).join(' ') || apiData.first_name || '';

      const transformedData: User = {
        id: apiData.id,
        email: apiData.email,
        first_name: firstName,
        last_name: lastName,
        phone: apiData.phone || '',
        role: apiData.role || 'user',
        is_active: true,
        created_at: apiData.created_at || new Date().toISOString(),
        updated_at: apiData.updated_at || new Date().toISOString(),
      };

      // 保存済みユーザーデータを更新
      const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
      const updatedUser = { ...currentUser, ...transformedData };
      setToStorage(STORAGE_KEYS.USER_DATA, updatedUser);

      return transformedData;
    }

    return response;
  },

  // パスワード忘れ
  forgotPassword: async (data: ForgotPasswordForm): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/forgot-password', data);
  },

  // パスワードリセット
  resetPassword: async (data: ResetPasswordForm): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/reset-password', data);
  },

  // メール認証
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/verify-email', { token });
  },

  // 認証メール再送
  resendVerificationEmail: async (): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/resend-verification');
  },

  // パスワード変更
  changePassword: async (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/change-password', data);
  },

  // トークンリフレッシュ
  refreshToken: async (): Promise<AuthUser> => {
    const response = await apiClient.post<any>('/auth/refresh');

    if (response) {
      // APIレスポンスをUser型に変換
      const apiData = response;
      const nameParts = apiData.name?.split(' ') || [];
      const lastName = nameParts[0] || '';
      const firstName = nameParts.slice(1).join(' ') || '';

      const transformedData: AuthUser = {
        token: apiData.token,
        id: apiData.id,
        email: apiData.email,
        first_name: firstName,
        last_name: lastName,
        phone: apiData.phone || '',
        role: apiData.role || 'user',
        is_active: true,
        created_at: apiData.created_at || new Date().toISOString(),
        updated_at: apiData.updated_at || new Date().toISOString(),
      };

      setToStorage(STORAGE_KEYS.AUTH_TOKEN, transformedData.token);
      setToStorage(STORAGE_KEYS.USER_DATA, transformedData);

      return transformedData;
    }

    return response;
  },

  // 認証状態の確認
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  },

  // 保存済みユーザーデータを取得
  getStoredUser: (): User | null => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  // 保存済み認証トークンを取得
  getStoredToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};