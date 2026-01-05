// APIレスポンスの型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ユーザー
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  order_count?: number;
  total_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  token: string;
}

// 商品
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category?: Category;
  sku: string;
  stock_quantity: number;
  images: any[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductForm {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category_id: number;
  sku?: string;
  is_active: boolean;
  is_featured: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
}

// カート
export interface CartItem {
  id: number;
  product_id: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total_price: number;
  total_items: number;
  created_at: string;
  updated_at: string;
}

// 注文ステータス
// TODO: もっといい定義の仕方があるかもしれない
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

// 注文
export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: string;
  items: OrderItem[];
  user?: User;
  shipping_address: Address;
  billing_address?: Address;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product: Product;
  quantity: number;
  price: number;
  total?: number;
}

// 住所
export interface Address {
  id?: number;
  user_id?: number;
  type?: string;
  first_name: string;
  last_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  full_name?: string;
  full_address?: string;
  phone?: string;
  is_default: boolean;
}

export interface CreateAddressData {
  type?: string;
  first_name: string;
  last_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  phone?: string;
  is_default?: boolean;
}

// フォーム
export interface LoginForm {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

// フィルター
export interface ProductFilters {
  category_id?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
  in_stock?: boolean;
  is_featured?: boolean;
  featured?: boolean;
}

// エラー
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}
