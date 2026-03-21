import { adminApiClient } from './adminAuthService';
import { Product, ProductForm, PaginatedResponse } from '../types';

interface AdminApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  is_active?: boolean;
  featured?: boolean;
  in_stock?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: 'name' | 'price' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export const adminProductService = {
  // 商品一覧取得（フィルター・ページネーション対応）
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.category_id) {
      params.append('category_id', filters.category_id.toString());
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString());
    }
    if (filters?.featured !== undefined) {
      params.append('featured', filters.featured.toString());
    }
    if (filters?.in_stock !== undefined) {
      params.append('in_stock', filters.in_stock.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }
    if (filters?.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters?.sort_order) {
      params.append('sort_order', filters.sort_order);
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/products?${queryString}` : '/admin/products';

    const response = await adminApiClient.get<any>(url);
    const apiData = response.data.data || response.data;
    return {
      data: apiData.products || [],
      pagination: apiData.pagination || { current_page: 1, per_page: 15, total: 0, total_pages: 1 },
    };
  },

  // 商品をIDで取得
  getProductById: async (id: number): Promise<Product> => {
    const response = await adminApiClient.get<AdminApiResponse<Product>>(`/admin/products/${id}`);
    return response.data.data;
  },

  // 新規商品作成
  createProduct: async (productData: ProductForm): Promise<Product> => {
    const response = await adminApiClient.post<AdminApiResponse<Product>>(
      '/admin/products',
      productData
    );
    return response.data.data;
  },

  // 商品更新
  updateProduct: async (id: number, productData: Partial<ProductForm>): Promise<Product> => {
    const response = await adminApiClient.put<AdminApiResponse<Product>>(
      `/admin/products/${id}`,
      productData
    );
    return response.data.data;
  },

  // 商品削除
  deleteProduct: async (id: number): Promise<void> => {
    await adminApiClient.delete(`/admin/products/${id}`);
  },

  // 商品の有効/無効を切り替え
  toggleActive: async (id: number, isActive: boolean): Promise<Product> => {
    const response = await adminApiClient.patch<AdminApiResponse<Product>>(
      `/admin/products/${id}/toggle-active`,
      { is_active: isActive }
    );
    return response.data.data;
  },

  // おすすめ商品の切り替え
  toggleFeatured: async (id: number, featured: boolean): Promise<Product> => {
    const response = await adminApiClient.patch<AdminApiResponse<Product>>(
      `/admin/products/${id}/toggle-featured`,
      { featured }
    );
    return response.data.data;
  },

  // 商品画像をアップロード
  uploadProductImage: async (id: number, imageFile: File, isPrimary: boolean = false): Promise<Product> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('is_primary', isPrimary.toString());

    const response = await adminApiClient.post<AdminApiResponse<Product>>(
      `/admin/products/${id}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // 商品削除 image
  deleteProductImage: async (productId: number, imageId: number): Promise<Product> => {
    const response = await adminApiClient.delete<AdminApiResponse<Product>>(
      `/admin/products/${productId}/images/${imageId}`
    );
    return response.data.data;
  },

  // メイン画像を設定
  setPrimaryImage: async (productId: number, imageId: number): Promise<Product> => {
    const response = await adminApiClient.patch<AdminApiResponse<Product>>(
      `/admin/products/${productId}/images/${imageId}/set-primary`
    );
    return response.data.data;
  },

  // 在庫数を更新
  updateStock: async (id: number, quantity: number): Promise<Product> => {
    const response = await adminApiClient.patch<AdminApiResponse<Product>>(
      `/admin/products/${id}/stock`,
      { stock_quantity: quantity }
    );
    return response.data.data;
  },

  // 商品の一括更新
  bulkUpdate: async (updates: Array<{ id: number; data: Partial<ProductForm> }>): Promise<void> => {
    await adminApiClient.post('/admin/products/bulk-update', { updates });
  },

  // 商品の一括削除
  bulkDelete: async (ids: number[]): Promise<void> => {
    await adminApiClient.post('/admin/products/bulk-delete', { ids });
  },

  // 商品をCSVにエクスポート
  exportToCSV: async (filters?: ProductFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.category_id) {
      params.append('category_id', filters.category_id.toString());
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/products/export?${queryString}` : '/admin/products/export';

    const response = await adminApiClient.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },
};
