import { adminApiClient } from './adminAuthService';
import { Product, PaginatedResponse } from '../types';

interface AdminApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  product: Product;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  last_restocked_at?: string;
}

export interface InventoryFilters {
  search?: string;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean;
  category_id?: number;
  page?: number;
  per_page?: number;
}

export interface StockUpdateData {
  quantity: number;
  type: 'add' | 'set' | 'subtract';
  notes?: string;
}

export interface InventoryStatistics {
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_inventory_value: number;
}

export const adminInventoryService = {
  // 在庫一覧取得（フィルター・ページネーション対応）
  getInventory: async (filters?: InventoryFilters): Promise<PaginatedResponse<InventoryItem>> => {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.low_stock_only) {
      params.append('low_stock_only', 'true');
    }
    if (filters?.out_of_stock_only) {
      params.append('out_of_stock_only', 'true');
    }
    if (filters?.category_id) {
      params.append('category_id', filters.category_id.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/inventory?${queryString}` : '/admin/inventory';

    const response = await adminApiClient.get<any>(url);
    const apiData = response.data.data || response.data;
    return {
      data: apiData.products || apiData.inventory || [],
      pagination: apiData.pagination || { current_page: 1, per_page: 15, total: 0, total_pages: 1 },
    };
  },

  // 商品IDで在庫情報を取得
  getInventoryByProductId: async (productId: number): Promise<InventoryItem> => {
    const response = await adminApiClient.get<AdminApiResponse<InventoryItem>>(
      `/admin/inventory/product/${productId}`
    );
    return response.data.data;
  },

  // 在庫数を更新
  updateStock: async (productId: number, updateData: StockUpdateData): Promise<InventoryItem> => {
    const response = await adminApiClient.put<AdminApiResponse<InventoryItem>>(
      `/admin/inventory/product/${productId}`,
      updateData
    );
    return response.data.data;
  },

  // 在庫少アラートの閾値を設定
  setLowStockThreshold: async (productId: number, threshold: number): Promise<InventoryItem> => {
    const response = await adminApiClient.put<AdminApiResponse<InventoryItem>>(
      `/admin/inventory/product/${productId}/threshold`,
      { low_stock_threshold: threshold }
    );
    return response.data.data;
  },

  // 在庫統計を取得
  getStatistics: async (): Promise<InventoryStatistics> => {
    const response = await adminApiClient.get<AdminApiResponse<InventoryStatistics>>(
      '/admin/inventory/statistics'
    );
    return response.data.data;
  },

  // 在庫情報をCSVにエクスポート
  exportToCSV: async (): Promise<Blob> => {
    const response = await adminApiClient.get('/admin/inventory/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // 在庫少アラートを取得
  getLowStockAlerts: async (): Promise<InventoryItem[]> => {
    const response = await adminApiClient.get<AdminApiResponse<InventoryItem[]>>(
      '/admin/inventory/low-stock-alerts'
    );
    return response.data.data;
  },

  // 商品の在庫変動履歴を取得
  getStockHistory: async (productId: number): Promise<any[]> => {
    const response = await adminApiClient.get<AdminApiResponse<any[]>>(
      `/admin/inventory/product/${productId}/history`
    );
    return response.data.data;
  },
};
