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
  stock_quantity: 10,
  sku: 'TEST-SKU-001',
  category_id: 1,
  is_active: true,
  featured: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category: {
    id: 1,
    name: 'Electronics',
    description: 'Electronic products',
    is_active: true,
    sort_order: 1,
  },
  images: [
    {
      id: 1,
      product_id: 1,
      url: '/images/test-product.jpg',
      alt_text: 'Test Product Image',
      is_primary: true,
      sort_order: 1,
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

    const image = screen.getByAltText('Test Product Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('test-product.jpg'));
  });

  it('displays "In Stock" when stock quantity is sufficient', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('displays limited stock warning when stock is low', () => {
    const lowStockProduct = { ...mockProduct, stock_quantity: 5 };
    renderWithRouter(<ProductCard product={lowStockProduct} />);

    expect(screen.getByText('Only 5 left')).toBeInTheDocument();
  });

  it('displays "Out of Stock" chip when stock is zero', () => {
    const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
    renderWithRouter(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('disables add to cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
    renderWithRouter(<ProductCard product={outOfStockProduct} />);

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addButton).toBeDisabled();
  });

  it('calls onAddToCart when add to cart button is clicked', () => {
    const mockOnAddToCart = jest.fn();
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />
    );

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('displays featured chip when product is featured', () => {
    const featuredProduct = { ...mockProduct, featured: true };
    renderWithRouter(<ProductCard product={featuredProduct} />);

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('handles missing product images gracefully', () => {
    const productWithoutImages = { ...mockProduct, images: [] };
    renderWithRouter(<ProductCard product={productWithoutImages} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
  });

  it('displays category name when available', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('handles product without category', () => {
    const productWithoutCategory = { ...mockProduct, category: undefined };
    renderWithRouter(<ProductCard product={productWithoutCategory} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
  });
});
