import { apiClient } from './api';
import { Order, ApiResponse, PaginatedResponse } from '../types';

export interface CreateOrderData {
  shipping_address_id?: number;
  billing_address_id?: number;
  shipping_address?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  billing_address?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  payment_method: string;
  notes?: string;
}

export interface OrderFilters {
  status?: string;
  page?: number;
  per_page?: number;
}

export const orderService = {
  // 新規注文を作成
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', orderData);
    return response.data;
  },

  // 現在のユーザーの注文一覧を取得
  getOrders: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/orders?${queryString}` : '/orders';

    const response = await apiClient.get<PaginatedResponse<Order>>(url);
    return response;
  },

  // 注文をIDで取得
  getOrderById: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data;
  },

  // 注文をキャンセル（キャンセル可能な場合）
  cancelOrder: async (orderId: number): Promise<Order> => {
    const response = await apiClient.put<ApiResponse<Order>>(`/orders/${orderId}/cancel`);
    return response.data;
  },
};
