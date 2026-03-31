import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// 管理者認証用の専用APIクライアント
export const adminApiClient = axios.create({
  baseURL: process.env.REACT_APP_ADMIN_API_URL ? `${process.env.REACT_APP_ADMIN_API_URL}/api` : 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター: トークンを自動的に追加
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター: エラーハンドリング
adminApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_DATA);
      // 管理者ログインページにいる場合はリダイレクトしない
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  last_login_at?: string;
}

export interface AdminLoginForm {
  email: string;
  password: string;
}

interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    admin: AdminUser;
  };
}

export const adminAuthService = {
  // 管理者ログイン
  login: async (credentials: AdminLoginForm): Promise<AdminUser> => {
    try {
      const response = await adminApiClient.post<AdminLoginResponse>('/admin/login', credentials);

      if (response.data.success && response.data.data) {
        const { access_token, admin } = response.data.data;

        // トークンと管理者データを保存（管理者専用キー）
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER_DATA, JSON.stringify(admin));

        return admin;
      } else {
        throw new Error('ログインに失敗しました');
      }
    } catch (error) {
      console.error('管理者ログインエラー:', error);
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message || '';

        // 英語のエラーメッセージを日本語に変換
        const errorMessageMap: { [key: string]: string } = {
          'Invalid credentials': 'メールアドレスまたはパスワードが正しくありません',
          'Invalid email or password': 'メールアドレスまたはパスワードが正しくありません',
          'The provided credentials are incorrect.': 'メールアドレスまたはパスワードが正しくありません',
          'Unauthorized': '認証に失敗しました',
          'User not found': 'ユーザーが見つかりません',
          'Account is inactive': 'アカウントが無効になっています',
          'Too many login attempts': 'ログイン試行回数が多すぎます。しばらく待ってから再度お試しください',
        };

        // マッピングにある場合は日本語メッセージを使用、なければデフォルトメッセージ
        let errorMessage = 'ログインに失敗しました';
        for (const [englishMsg, japaneseMsg] of Object.entries(errorMessageMap)) {
          if (backendMessage.includes(englishMsg)) {
            errorMessage = japaneseMsg;
            break;
          }
        }

        // 401エラーの場合は特別に処理
        if (error.response?.status === 401) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません';
        }

        throw new Error(errorMessage);
      }
      throw new Error('ログインに失敗しました');
    }
  },

  // 管理者ログアウト
  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_DATA);
  },

  // 管理者認証状態確認
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH_TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.ADMIN_USER_DATA);
    
    if (!token || !userData) return false;
    
    try {
      const user = JSON.parse(userData);
      return user.role === 'super_admin' || user.role === 'admin';
    } catch {
      return false;
    }
  },

  // 保存された管理者データ取得
  getStoredAdmin: (): AdminUser | null => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.ADMIN_USER_DATA);
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      if (user.role === 'super_admin' || user.role === 'admin') {
        return user;
      }
      return null;
    } catch {
      return null;
    }
  },
};