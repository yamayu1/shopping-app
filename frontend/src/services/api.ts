import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

// axiosインスタンスの作成
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエスト時にトークンを付与
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      // localStorageにはJSON.stringifyで保存しているのでパースする
      try {
        const parsedToken = JSON.parse(token);
        config.headers.Authorization = `Bearer ${parsedToken}`;
      } catch {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスのエラーハンドリング
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401エラー（認証切れ）の場合はログイン画面にリダイレクト
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API呼び出し用のヘルパー
export const apiClient = {
  get: async <T = any>(url: string, config?: any): Promise<T> => {
    const response = await api.get(url, config);
    return response.data;
  },
  post: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await api.post(url, data, config);
    return response.data;
  },
  put: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await api.put(url, data, config);
    return response.data;
  },
  delete: async <T = any>(url: string, config?: any): Promise<T> => {
    const response = await api.delete(url, config);
    return response.data;
  },
};

export default api;
