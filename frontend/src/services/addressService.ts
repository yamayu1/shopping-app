import { apiClient } from './api';
import { Address, CreateAddressData } from '../types';

export type { CreateAddressData } from '../types';

export const addressService = {
  getAddresses: async (): Promise<Address[]> => {
    const { data } = await apiClient.get<any>('/addresses');
    return data?.addresses || [];
  },

  getAddressById: async (addressId: number): Promise<Address> => {
    const { data } = await apiClient.get<any>(`/addresses/${addressId}`);
    return data?.address;
  },

  createAddress: async (addressData: CreateAddressData): Promise<Address> => {
    const { data } = await apiClient.post<any>('/addresses', addressData);
    return data?.address;
  },

  updateAddress: async (addressId: number, addressData: Partial<CreateAddressData>): Promise<Address> => {
    const res = await apiClient.put<any>(`/addresses/${addressId}`, addressData);
    return res.data?.address;
  },

  deleteAddress: async (addressId: number): Promise<void> => {
    await apiClient.delete(`/addresses/${addressId}`);
  },

  setDefaultAddress: async (addressId: number): Promise<Address> => {
    const res = await apiClient.put<any>(`/addresses/${addressId}/set_default`);
    return res.data?.address;
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
