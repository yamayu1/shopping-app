import { apiClient } from './api';
import { Cart, CartItem, ApiResponse } from '../types';

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get<any>('/cart');
    return response.data?.cart;
  },

  addItem: async (data: { product_id: number; quantity: number }): Promise<Cart> => {
    const response = await apiClient.post<any>('/cart/items', data);
    return response.data?.cart;
  },

  updateQuantity: async (productId: number, quantity: number): Promise<Cart> => {
    const response = await apiClient.put<any>('/cart/items', { product_id: productId, quantity });
    return response.data?.cart;
  },

  removeItem: async (productId: number): Promise<Cart> => {
    const response = await apiClient.delete<any>('/cart/items', { data: { product_id: productId } });
    return response.data?.cart;
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete<any>('/cart');
  },

  getItemCount: async (): Promise<number> => {
    const cart = await cartService.getCart();
    return (cart.items || []).reduce((total: number, item: CartItem) => total + item.quantity, 0);
  },

  calculateTotal: (cart: Cart): number => {
    return (cart.items || []).reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
  },
};
