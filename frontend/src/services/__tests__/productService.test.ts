import { productService } from '../productService';
import { apiClient } from '../api';

jest.mock('../api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockProduct = {
  id: 1,
  name: 'Test Product',
  description: 'Description',
  price: 1000,
  category_id: 1,
  sku: 'TST-001',
  stock_quantity: 50,
  images: [],
  is_active: true,
  featured: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('fetches products with default params', async () => {
      mockedApiClient.get.mockResolvedValue({
        data: {
          products: [mockProduct],
          pagination: { current_page: 1, per_page: 12, total: 1, total_pages: 1 },
        },
      });

      const result = await productService.getProducts();

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/products?')
      );
      expect(result.data).toEqual([mockProduct]);
    });

    it('fetches products with custom filters', async () => {
      mockedApiClient.get.mockResolvedValue({
        data: {
          products: [],
          pagination: { current_page: 2, per_page: 10, total: 0, total_pages: 1 },
        },
      });

      const result = await productService.getProducts(
        { category_id: 1, search: 'test' },
        2,
        10
      );

      const calledUrl = (mockedApiClient.get as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('category_id=1');
      expect(calledUrl).toContain('search=test');
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('per_page=10');
    });

    it('handles API error', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(productService.getProducts()).rejects.toThrow('Network Error');
    });
  });

  describe('getProduct', () => {
    it('fetches a single product by ID', async () => {
      mockedApiClient.get.mockResolvedValue({
        data: { product: mockProduct },
      });

      const result = await productService.getProduct(1);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/products/1');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getCategories', () => {
    it('fetches all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Electronics', is_active: true, sort_order: 1 },
      ];
      mockedApiClient.get.mockResolvedValue({
        data: { categories: mockCategories },
      });

      const result = await productService.getCategories();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockCategories);
    });
  });
});
