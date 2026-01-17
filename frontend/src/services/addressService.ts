import { apiClient } from './api';
import { Address, CreateAddressData } from '../types';

export type { CreateAddressData } from '../types';

export const addressService = {
  // 現在のユーザーの住所一覧を取得
  getAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.get<any>('/addresses');
    return response.data?.addresses || [];
  },

  // IDで住所を取得
  getAddressById: async (addressId: number): Promise<Address> => {
    const response = await apiClient.get<any>(`/addresses/${addressId}`);
    return response.data?.address;
  },

  // 新規住所を作成
  createAddress: async (addressData: CreateAddressData): Promise<Address> => {
    const response = await apiClient.post<any>('/addresses', addressData);
    return response.data?.address;
  },

  // 住所を更新
  updateAddress: async (addressId: number, addressData: Partial<CreateAddressData>): Promise<Address> => {
    const response = await apiClient.put<any>(`/addresses/${addressId}`, addressData);
    return response.data?.address;
  },

  // 住所を削除
  deleteAddress: async (addressId: number): Promise<void> => {
    await apiClient.delete<any>(`/addresses/${addressId}`);
  },

  // デフォルト住所に設定
  setDefaultAddress: async (addressId: number): Promise<Address> => {
    const response = await apiClient.put<any>(`/addresses/${addressId}/set_default`);
    return response.data?.address;
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
