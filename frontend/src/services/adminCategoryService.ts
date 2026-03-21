import { adminApiClient } from './adminAuthService';
import { Category, PaginatedResponse } from '../types';

interface AdminApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CategoryForm {
  name: string;
  description?: string;
  parent_id?: number | null;
  image?: string;
  is_active: boolean;
  sort_order: number;
}

export interface CategoryFilters {
  search?: string;
  parent_id?: number | null;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export const adminCategoryService = {
  // カテゴリ一覧取得（フィルター・ページネーション対応）
  getCategories: async (filters?: CategoryFilters): Promise<PaginatedResponse<Category>> => {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        params.append('parent_id', '');
      } else {
        params.append('parent_id', filters.parent_id.toString());
      }
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/categories?${queryString}` : '/admin/categories';

    const response = await adminApiClient.get<any>(url);
    const apiData = response.data.data || response.data;
    return {
      data: apiData.categories || [],
      pagination: apiData.pagination || { current_page: 1, per_page: 15, total: 0, total_pages: 1 },
    };
  },

  // カテゴリをツリー構造（階層構造）で取得
  getCategoryTree: async (): Promise<Category[]> => {
    const response = await adminApiClient.get<AdminApiResponse<Category[]>>('/admin/categories/tree');
    return response.data.data;
  },

  // カテゴリをIDで取得
  getCategoryById: async (id: number): Promise<Category> => {
    const response = await adminApiClient.get<AdminApiResponse<Category>>(`/admin/categories/${id}`);
    return response.data.data;
  },

  // 新規カテゴリを作成
  createCategory: async (categoryData: CategoryForm): Promise<Category> => {
    const response = await adminApiClient.post<AdminApiResponse<Category>>(
      '/admin/categories',
      categoryData
    );
    return response.data.data;
  },

  // カテゴリを更新
  updateCategory: async (id: number, categoryData: CategoryForm): Promise<Category> => {
    const response = await adminApiClient.put<AdminApiResponse<Category>>(
      `/admin/categories/${id}`,
      categoryData
    );
    return response.data.data;
  },

  // カテゴリを削除
  deleteCategory: async (id: number): Promise<void> => {
    await adminApiClient.delete(`/admin/categories/${id}`);
  },

  // カテゴリの有効/無効を切り替え
  toggleActive: async (id: number, isActive: boolean): Promise<Category> => {
    const response = await adminApiClient.patch<AdminApiResponse<Category>>(
      `/admin/categories/${id}/toggle-active`,
      { is_active: isActive }
    );
    return response.data.data;
  },

  // カテゴリの並び順を変更
  reorderCategories: async (categoryOrders: Array<{ id: number; sort_order: number }>): Promise<void> => {
    await adminApiClient.post('/admin/categories/reorder', { categories: categoryOrders });
  },

  // カテゴリ画像をアップロード
  uploadCategoryImage: async (id: number, imageFile: File): Promise<Category> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await adminApiClient.post<AdminApiResponse<Category>>(
      `/admin/categories/${id}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // カテゴリを削除 image
  deleteCategoryImage: async (id: number): Promise<Category> => {
    const response = await adminApiClient.delete<AdminApiResponse<Category>>(
      `/admin/categories/${id}/image`
    );
    return response.data.data;
  },
};
