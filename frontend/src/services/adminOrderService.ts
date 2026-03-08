import { adminApiClient } from './adminAuthService';
import { Order, OrderStatus, PaginatedResponse } from '../types';

interface AdminApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AdminOrderFilters {
  status?: OrderStatus;
  search?: string;
  page?: number;
  per_page?: number;
  date_from?: string;
  date_to?: string;
}

export const adminOrderService = {
  // 注文一覧取得（フィルター・ページネーション対応）
  getOrders: async (filters?: AdminOrderFilters): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/orders?${queryString}` : '/admin/orders';

    const response = await adminApiClient.get<AdminApiResponse<PaginatedResponse<Order>>>(url);
    return response.data.data;
  },

  // 注文をIDで取得
  getOrderById: async (orderId: number): Promise<Order> => {
    const response = await adminApiClient.get<AdminApiResponse<Order>>(`/admin/orders/${orderId}`);
    return response.data.data;
  },

  // 注文ステータスを更新
  updateStatus: async (orderId: number, status: OrderStatus): Promise<Order> => {
    const response = await adminApiClient.put<AdminApiResponse<Order>>(
      `/admin/orders/${orderId}/status`,
      { status }
    );
    return response.data.data;
  },

  // 注文統計を取得
  getStatistics: async (): Promise<{
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    completed_orders: number;
  }> => {
    const response = await adminApiClient.get<AdminApiResponse<{
      total_orders: number;
      total_revenue: number;
      pending_orders: number;
      completed_orders: number;
    }>>('/admin/orders/statistics');
    return response.data.data;
  },
};
