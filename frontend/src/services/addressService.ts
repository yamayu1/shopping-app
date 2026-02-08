import { apiClient } from './api';
import { Address, ApiResponse } from '../types';

export interface CreateAddressData {
  type: 'shipping' | 'billing';
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
  is_default: boolean;
}

export const addressService = {
  // 現在のユーザーの住所一覧を取得
  getAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.get<ApiResponse<Address[]>>('/addresses');
    return response.data;
  },

  // IDで住所を取得
  getAddressById: async (addressId: number): Promise<Address> => {
    const response = await apiClient.get<ApiResponse<Address>>(`/addresses/${addressId}`);
    return response.data;
  },

  // 新規住所を作成
  createAddress: async (addressData: CreateAddressData): Promise<Address> => {
    const response = await apiClient.post<ApiResponse<Address>>('/addresses', addressData);
    return response.data;
  },

  // 住所を更新
  updateAddress: async (addressId: number, addressData: Partial<CreateAddressData>): Promise<Address> => {
    const response = await apiClient.put<ApiResponse<Address>>(`/addresses/${addressId}`, addressData);
    return response.data;
  },

  // 住所を削除
  deleteAddress: async (addressId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/addresses/${addressId}`);
  },

  // デフォルト住所に設定
  setDefaultAddress: async (addressId: number): Promise<Address> => {
    const response = await apiClient.put<ApiResponse<Address>>(`/addresses/${addressId}/set-default`);
    return response.data;
  },

  // デフォルトの配送先住所を取得
  getDefaultShippingAddress: async (): Promise<Address | null> => {
    const addresses = await addressService.getAddresses();
    return addresses.find(addr => addr.type === 'shipping' && addr.is_default) || null;
  },

  // デフォルトの請求先住所を取得
  getDefaultBillingAddress: async (): Promise<Address | null> => {
    const addresses = await addressService.getAddresses();
    return addresses.find(addr => addr.type === 'billing' && addr.is_default) || null;
  },
};
