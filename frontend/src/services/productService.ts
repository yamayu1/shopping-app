import { apiClient } from './api';
import {
  Product,
  Category,
  ProductFilters,
  PaginatedResponse,
  ApiResponse,
} from '../types';
import { buildQueryString } from '../utils/helpers';

export const productService = {
  // 全商品をフィルター・ページネーション付きで取得
  getProducts: async (
    filters: ProductFilters = {},
    page: number = 1,
    perPage: number = 12
  ): Promise<PaginatedResponse<Product>> => {
    const queryParams = {
      ...filters,
      page,
      per_page: perPage,
    };
    const queryString = buildQueryString(queryParams);
    const response = await apiClient.get<any>(
      `/products?${queryString}`
    );
    return {
      data: response.data?.products || [],
      pagination: response.data?.pagination || { current_page: 1, per_page: 12, total: 0, total_pages: 1 },
    };
  },

  // 商品をIDで取得
  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get<any>(`/products/${id}`);
    return response.data?.product || response.data;
  },

  // おすすめ商品を取得
  getFeaturedProducts: async (limit: number = 8): Promise<Product[]> => {
    const response = await apiClient.get<any>(
      `/products/featured?limit=${limit}`
    );
    return response.data?.products || [];
  },

  // 関連商品を取得
  getRelatedProducts: async (productId: number, limit: number = 4): Promise<Product[]> => {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      `/products/${productId}/related?limit=${limit}`
    );
    return response.data;
  },

  // 商品を検索
  searchProducts: async (
    query: string,
    filters: Omit<ProductFilters, 'search'> = {},
    page: number = 1,
    perPage: number = 12
  ): Promise<PaginatedResponse<Product>> => {
    const queryParams = {
      ...filters,
      search: query,
      page,
      per_page: perPage,
    };
    const queryString = buildQueryString(queryParams);
    const response = await apiClient.get<any>(
      `/products/search?${queryString}`
    );
    return {
      data: response.data?.products || [],
      pagination: response.data?.pagination || { current_page: 1, per_page: 12, total: 0, total_pages: 1 },
    };
  },

  // 全カテゴリを取得
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<any>('/categories');
    return response.data?.categories || [];
  },

  // カテゴリをIDで取得
  getCategory: async (id: number): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  },

  // カテゴリ別に商品を取得
  getProductsByCategory: async (
    categoryId: number,
    page: number = 1,
    perPage: number = 12
  ): Promise<PaginatedResponse<Product>> => {
    const queryParams = {
      category_id: categoryId,
      page,
      per_page: perPage,
    };
    const queryString = buildQueryString(queryParams);
    const response = await apiClient.get<any>(
      `/products?${queryString}`
    );
    return {
      data: response.data?.products || [],
      pagination: response.data?.pagination || { current_page: 1, per_page: 12, total: 0, total_pages: 1 },
    };
  },

  // 管理者機能
  createProduct: async (productData: FormData): Promise<Product> => {
    const response = await apiClient.post<ApiResponse<Product>>(
      '/admin/products',
      productData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  updateProduct: async (id: number, productData: FormData): Promise<Product> => {
    const response = await apiClient.put<ApiResponse<Product>>(
      `/admin/products/${id}`,
      productData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  // カテゴリ管理
  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post<ApiResponse<Category>>(
      '/admin/categories',
      categoryData
    );
    return response.data;
  },

  updateCategory: async (id: number, categoryData: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put<ApiResponse<Category>>(
      `/admin/categories/${id}`,
      categoryData
    );
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },

  // 商品レビュー機能（実装済みの場合）
  getProductReviews: async (productId: number, page: number = 1): Promise<any> => {
    const response = await apiClient.get(
      `/products/${productId}/reviews?page=${page}`
    );
    return response;
  },

  createProductReview: async (productId: number, reviewData: any): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/products/${productId}/reviews`,
      reviewData
    );
    return response.data;
  },
};