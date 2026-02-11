import { adminApiClient } from './adminAuthService';
import { User, PaginatedResponse } from '../types';

interface AdminApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AdminUserFilters {
  search?: string;
  role?: 'user' | 'admin';
  email_verified?: boolean;
  page?: number;
  per_page?: number;
}

export interface UserStatistics {
  total_users: number;
  verified_users: number;
  unverified_users: number;
  new_users_this_month: number;
}

export const adminUserService = {
  // ユーザー一覧取得（フィルター・ページネーション対応）
  getUsers: async (filters?: AdminUserFilters): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.email_verified !== undefined) {
      params.append('email_verified', filters.email_verified.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/users?${queryString}` : '/admin/users';

    const response = await adminApiClient.get<AdminApiResponse<PaginatedResponse<User>>>(url);
    return response.data.data;
  },

  // ユーザーをIDで取得
  getUserById: async (userId: number): Promise<User> => {
    const response = await adminApiClient.get<AdminApiResponse<User>>(`/admin/users/${userId}`);
    return response.data.data;
  },

  // ユーザーステータスの更新（有効/無効）
  updateUserStatus: async (userId: number, isActive: boolean): Promise<User> => {
    const response = await adminApiClient.put<AdminApiResponse<User>>(
      `/admin/users/${userId}/status`,
      { is_active: isActive }
    );
    return response.data.data;
  },

  // ユーザーを削除
  deleteUser: async (userId: number): Promise<void> => {
    await adminApiClient.delete<AdminApiResponse<void>>(`/admin/users/${userId}`);
  },

  // ユーザー統計を取得
  getStatistics: async (): Promise<UserStatistics> => {
    const response = await adminApiClient.get<AdminApiResponse<UserStatistics>>('/admin/users/statistics');
    return response.data.data;
  },

  // ユーザーの注文履歴を取得
  getUserOrders: async (userId: number): Promise<any[]> => {
    const response = await adminApiClient.get<AdminApiResponse<any[]>>(`/admin/users/${userId}/orders`);
    return response.data.data;
  },
};
