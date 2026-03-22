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

  getProduct: async (id: number): Promise<Product> => {
    const res = await apiClient.get<any>(`/products/${id}`);
    return res.data?.product;
  },

  getFeaturedProducts: async (limit: number = 8): Promise<Product[]> => {
    const res = await apiClient.get<any>(`/products/featured?limit=${limit}`);
    return res.data?.products || [];
  },

  getRelatedProducts: async (productId: number, limit: number = 4): Promise<Product[]> => {
    const res = await apiClient.get<any>(
      `/products/${productId}/related?limit=${limit}`
    );
    return res.data;
  },

  searchProducts: async (
    query: string,
    filters: Omit<ProductFilters, 'search'> = {},
    page: number = 1,
    perPage: number = 12
  ): Promise<PaginatedResponse<Product>> => {
    const queryParams = {
      ...filters,
      q: query,
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

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<any>('/categories');
    return data?.categories || [];
  },

  getCategory: async (id: number): Promise<Category> => {
    const { data } = await apiClient.get<any>(`/categories/${id}`);
    return data;
  },

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

};