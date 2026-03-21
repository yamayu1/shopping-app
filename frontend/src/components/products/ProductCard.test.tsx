import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import { Product } from '../../types';

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  description: 'Test product description',
  price: 1000,
  stock_quantity: 20,
  category_id: 1,
  is_active: true,
  sku: 'TEST-001',
  is_featured: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  category: {
    id: 1,
    name: 'Electronics',
    is_active: true,
    sort_order: 0,
  },
  images: [
    {
      id: 1,
      url: '/images/test-product.jpg',
      alt_text: 'Test Product Image',
    },
  ],
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test product description')).toBeInTheDocument();
    expect(screen.getByText('¥1,000')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('displays product image', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('test-product.jpg'));
  });

  it('displays "在庫あり" when stock quantity is sufficient', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    expect(screen.getByText('在庫あり')).toBeInTheDocument();
  });

  it('disables add to cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
    renderWithRouter(<ProductCard product={outOfStockProduct} />);

    const addButton = screen.getByRole('button', { name: /カートに追加/i });
    expect(addButton).toBeDisabled();
  });

  it('calls onAddToCart when add to cart button is clicked', () => {
    const mockOnAddToCart = jest.fn();
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />
    );

    const addButton = screen.getByRole('button', { name: /カートに追加/i });
    fireEvent.click(addButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('handles product without category', () => {
    const productWithoutCategory = { ...mockProduct, category: undefined };
    renderWithRouter(<ProductCard product={productWithoutCategory} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
  });
});
