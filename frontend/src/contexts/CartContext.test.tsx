import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { cartService } from '../services/cartService';
import { Cart } from '../types';

jest.mock('../services/cartService');

const mockCart: Cart = {
  id: 1,
  user_id: 1,
  items: [
    {
      id: 1,
      product_id: 10,
      product: {
        id: 10,
        name: 'Test Product',
        description: 'Test',
        price: 1000,
        category_id: 1,
        stock_quantity: 50,
        images: [],
        is_active: true,
      },
      quantity: 2,
      price: 1000,
    },
  ],
  total_price: 2000,
  total_items: 2,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cartService.getCart as jest.Mock).mockResolvedValue(mockCart);
  });

  it('loads cart on mount', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cart).toEqual(mockCart);
    });

    expect(result.current.itemCount).toBe(2);
    expect(result.current.totalAmount).toBe(2000);
  });

  it('handles cart load error gracefully', async () => {
    (cartService.getCart as jest.Mock).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cart).toBeNull();
    expect(result.current.itemCount).toBe(0);
  });

  it('adds item to cart', async () => {
    const updatedCart = {
      ...mockCart,
      items: [
        ...mockCart.items,
        {
          id: 2,
          product_id: 20,
          product: {
            id: 20,
            name: 'New Product',
            description: 'New',
            price: 500,
            category_id: 1,
            stock_quantity: 10,
            images: [],
            is_active: true,
          },
          quantity: 1,
          price: 500,
        },
      ],
      total_price: 2500,
      total_items: 3,
    };

    (cartService.addItem as jest.Mock).mockResolvedValue(updatedCart);

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cart).toEqual(mockCart);
    });

    await act(async () => {
      await result.current.addToCart(20, 1);
    });

    expect(cartService.addItem).toHaveBeenCalledWith(20, 1);
    expect(result.current.cart).toEqual(updatedCart);
  });

  it('removes item from cart', async () => {
    const updatedCart = {
      ...mockCart,
      items: [],
      total_price: 0,
      total_items: 0,
    };

    (cartService.removeItem as jest.Mock).mockResolvedValue(updatedCart);

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cart).toEqual(mockCart);
    });

    await act(async () => {
      await result.current.removeItem(1);
    });

    expect(cartService.removeItem).toHaveBeenCalledWith(1);
    expect(result.current.cart?.items).toHaveLength(0);
  });

  it('updates item quantity', async () => {
    const updatedCart = {
      ...mockCart,
      items: [{ ...mockCart.items[0], quantity: 5 }],
      total_price: 5000,
      total_items: 5,
    };

    (cartService.updateQuantity as jest.Mock).mockResolvedValue(updatedCart);

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.cart).toEqual(mockCart);
    });

    await act(async () => {
      await result.current.updateQuantity(1, 5);
    });

    expect(cartService.updateQuantity).toHaveBeenCalledWith(1, 5);
    expect(result.current.cart?.items[0].quantity).toBe(5);
  });
});
