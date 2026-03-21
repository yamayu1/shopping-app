import { apiClient } from './api';
import { Address, CreateAddressData } from '../types';

export type { CreateAddressData } from '../types';

export const addressService = {
  getAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.get<any>('/addresses');
    return response.data?.addresses || [];
  },

  getAddressById: async (addressId: number): Promise<Address> => {
    const response = await apiClient.get<any>(`/addresses/${addressId}`);
    return response.data?.address;
  },

  createAddress: async (addressData: CreateAddressData): Promise<Address> => {
    const response = await apiClient.post<any>('/addresses', addressData);
    return response.data?.address;
  },

  updateAddress: async (addressId: number, addressData: Partial<CreateAddressData>): Promise<Address> => {
    const response = await apiClient.put<any>(`/addresses/${addressId}`, addressData);
    return response.data?.address;
  },

  deleteAddress: async (addressId: number): Promise<void> => {
    await apiClient.delete<any>(`/addresses/${addressId}`);
  },

  setDefaultAddress: async (addressId: number): Promise<Address> => {
    const response = await apiClient.put<any>(`/addresses/${addressId}/set_default`);
    return response.data?.address;
  },

  getDefaultShippingAddress: async (): Promise<Address | null> => {
    const addresses = await addressService.getAddresses();
    return addresses.find(addr => addr.type === 'shipping' && addr.is_default) || null;
  },

  getDefaultBillingAddress: async (): Promise<Address | null> => {
    const addresses = await addressService.getAddresses();
    return addresses.find(addr => addr.type === 'billing' && addr.is_default) || null;
  },
};
