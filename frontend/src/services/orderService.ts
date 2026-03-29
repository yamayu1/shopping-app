import { apiClient } from './api';
import { Order, ApiResponse, PaginatedResponse } from '../types';

export interface CreateOrderData {
  address_id: number;
  payment_method: string;
  notes?: string;
}

export interface OrderFilters {
  status?: string;
  page?: number;
  per_page?: number;
}

export const orderService = {
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    const response = await apiClient.post<any>('/orders', orderData);
    return response.data?.order;
  },

  // 注文一覧を取得。フィルターはURLSearchParamsで組み立ててる
  // productServiceではbuildQueryStringを使ってるけど、こっちは手動でやってしまった
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

    const response = await apiClient.get<any>(url);
    return {
      data: response.data?.orders || [],
      pagination: response.data?.pagination || { current_page: 1, per_page: 10, total: 0, total_pages: 1 },
    };
  },

  getOrderById: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get<any>(`/orders/${orderId}`);
    return response.data?.order;
  },

  cancelOrder: async (orderId: number): Promise<Order> => {
    const response = await apiClient.put<any>(`/orders/${orderId}/cancel`);
    return response.data?.order;
  },
};
