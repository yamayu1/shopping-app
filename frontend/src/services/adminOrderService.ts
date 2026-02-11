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

    const response = await adminApiClient.get<any>(url);
    const apiData = response.data.data;
    return {
      data: apiData.orders || [],
      pagination: apiData.pagination || { current_page: 1, per_page: 10, total: 0, total_pages: 1 },
    };
  },

  // 注文を注文番号で取得
  getOrderByNumber: async (orderNumber: string): Promise<Order> => {
    const response = await adminApiClient.get<any>(`/admin/orders/${orderNumber}`);
    return response.data.data?.order;
  },

  // 注文ステータスを更新
  updateStatus: async (orderNumber: string, status: OrderStatus): Promise<Order> => {
    const response = await adminApiClient.put<any>(
      `/admin/orders/${orderNumber}/status`,
      { status }
    );
    return response.data.data?.order;
  },

  // 注文統計を取得
  getStatistics: async (): Promise<{
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    completed_orders: number;
  }> => {
    const response = await adminApiClient.get<any>('/admin/orders/statistics');
    const data = response.data?.data;
    return data?.statistics || data;
  },
};
