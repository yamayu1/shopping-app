import { apiClient } from './api';
import { Cart, CartItem, ApiResponse } from '../types';

export const cartService = {
  // 現在のカートを取得
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get<ApiResponse<Cart>>('/cart');
    return response.data;
  },

  // カートに商品を追加
  addItem: async (data: { product_id: number; quantity: number }): Promise<Cart> => {
    const response = await apiClient.post<ApiResponse<Cart>>('/cart/items', data);
    return response.data;
  },

  // カート内商品の数量を変更
  updateQuantity: async (itemId: number, quantity: number): Promise<Cart> => {
    const response = await apiClient.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  // カートから商品を削除
  removeItem: async (itemId: number): Promise<Cart> => {
    const response = await apiClient.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return response.data;
  },

  // カートを空にする
  clearCart: async (): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>('/cart');
  },

  // カート内の商品数を取得
  getItemCount: async (): Promise<number> => {
    const cart = await cartService.getCart();
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  },

  // カートの合計金額を計算
  calculateTotal: (cart: Cart): number => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
};
