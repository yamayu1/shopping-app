import { apiClient } from './api';
import { Cart, CartItem, ApiResponse } from '../types';

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const resp = await apiClient.get<any>('/cart');
    return resp.data?.cart;
  },

  addItem: async (productId: number, qty: number): Promise<Cart> => {
    const resp = await apiClient.post<any>('/cart/items', {
      product_id: productId,
      quantity: qty,
    });
    return resp.data?.cart;
  },

  updateQuantity: async (productId: number, qty: number): Promise<Cart> => {
    const resp = await apiClient.put<any>('/cart/items', {
      product_id: productId,
      quantity: qty,
    });
    return resp.data?.cart;
  },

  removeItem: async (productId: number): Promise<Cart> => {
    const resp = await apiClient.delete<any>('/cart/items', {
      data: { product_id: productId },
    });
    return resp.data?.cart;
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete<any>('/cart');
  },

  // カートの合計金額を計算
  calculateTotal: (cart: Cart): number => {
    if (!cart.items || cart.items.length === 0) return 0;
    let total = 0;
    for (const item of cart.items) {
      total += item.price * item.quantity;
    }
    return total;
  },
};
