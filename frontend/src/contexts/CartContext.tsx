import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cart } from '../types';
import { cartService } from '../services/cartService';
import { getErrorMessage } from '../utils/helpers';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  totalAmount: number;
  isLoading: boolean;
  error: string | null;
  loadCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearError: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const data = await cartService.getCart();
      // console.log('カート取得:', data);
      setCart(data);
    } catch (err) {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (productId: number, quantity: number) => {
    try {
      setIsLoading(true);
      const data = await cartService.addItem({ product_id: productId, quantity });
      setCart(data);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      setIsLoading(true);
      const data = await cartService.updateQuantity(itemId, quantity);
      setCart(data);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      const data = await cartService.removeItem(itemId);
      setCart(data);
    } catch (err) {
      console.error('カート削除エラー:', err);
      setError('商品の削除に失敗しました');
      throw err;
    }
    setIsLoading(false);
  };

  const clearCartAction = async () => {
    try {
      setIsLoading(true);
      await cartService.clearCart();
      setCart(null);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const itemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const totalAmount = cart?.total_price || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        totalAmount,
        isLoading,
        error,
        loadCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart: clearCartAction,
        clearError: () => setError(null),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
