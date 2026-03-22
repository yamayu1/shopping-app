import { cartService } from '../cartService';
import { apiClient } from '../api';
import { Cart } from '../../types';

jest.mock('../api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

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
        description: 'A test product',
        price: 1000,
        category_id: 1,
        sku: 'TST-001',
        stock_quantity: 50,
        images: [],
        is_active: true,
        featured: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      quantity: 2,
      price: 1000,
    },
    {
      id: 2,
      product_id: 20,
      product: {
        id: 20,
        name: 'Another Product',
        description: 'Another test product',
        price: 500,
        category_id: 2,
        sku: 'TST-002',
        stock_quantity: 10,
        images: [],
        is_active: true,
        featured: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      quantity: 3,
      price: 500,
    },
  ],
  total_amount: 3500,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('cartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('カート取得', () => {
    it('fetches the current cart', async () => {
      mockedApiClient.get.mockResolvedValue({ data: { cart: mockCart } });

      const result = await cartService.getCart();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(mockCart);
    });

    it('rejects when API fails', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(cartService.getCart()).rejects.toThrow('Network Error');
    });
  });

  describe('addItem', () => {
    it('adds an item to the cart', async () => {
      mockedApiClient.post.mockResolvedValue({ data: { cart: mockCart } });

      const result = await cartService.addItem(10, 2);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/cart/items', {
        product_id: 10,
        quantity: 2,
      });
      expect(result).toEqual(mockCart);
    });
  });

  describe('removeItem', () => {
    it('removes an item from the cart', async () => {
      mockedApiClient.delete.mockResolvedValue({ data: { cart: mockCart } });

      const result = await cartService.removeItem(1);

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/cart/items', {
        data: { product_id: 1 },
      });
      expect(result).toEqual(mockCart);
    });
  });

  describe('updateQuantity', () => {
    it('updates the quantity of a cart item', async () => {
      mockedApiClient.put.mockResolvedValue({ data: { cart: mockCart } });

      const result = await cartService.updateQuantity(1, 5);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/cart/items', {
        product_id: 1,
        quantity: 5,
      });
      expect(result).toEqual(mockCart);
    });
  });
});
