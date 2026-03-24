-- データベースの作成
CREATE DATABASE IF NOT EXISTS shopping_development;
CREATE DATABASE IF NOT EXISTS shopping_test;
CREATE DATABASE IF NOT EXISTS shopping_production;

-- 権限の付与
GRANT ALL PRIVILEGES ON shopping_development.* TO 'shopping_user'@'%';
GRANT ALL PRIVILEGES ON shopping_test.* TO 'shopping_user'@'%';
GRANT ALL PRIVILEGES ON shopping_production.* TO 'shopping_user'@'%';
FLUSH PRIVILEGES;

-- 開発用データベースを使用
USE shopping_development;

-- 管理者テーブル
CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'manager', 'editor') DEFAULT 'editor',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  remember_token VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_admins_email_is_active (email, is_active),
  INDEX idx_admins_role (role),
  INDEX idx_admins_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- カテゴリテーブル
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  parent_id BIGINT UNSIGNED NULL,
  image VARCHAR(255) NULL,
  icon VARCHAR(255) NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  meta_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  attributes JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_categories_name (name),
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_active (active),
  INDEX idx_categories_is_active (is_active),
  INDEX idx_categories_is_featured (is_featured),
  INDEX idx_categories_sort_order (sort_order),
  INDEX idx_categories_parent_sort (parent_id, sort_order),
  INDEX idx_categories_slug_active (slug, is_active),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品テーブル
CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT NULL,
  sku VARCHAR(255) NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NULL,
  cost_price DECIMAL(10,2) NULL,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  category_id BIGINT UNSIGNED NOT NULL,
  status INT DEFAULT 0,
  brand VARCHAR(255) NULL,
  weight DECIMAL(8,2) NULL,
  dimensions JSON NULL,
  color VARCHAR(100) NULL,
  size VARCHAR(100) NULL,
  material VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  meta_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  tags JSON NULL,
  images JSON NULL,
  attributes JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_products_sku (sku),
  INDEX idx_products_name (name),
  INDEX idx_products_status (status),
  INDEX idx_products_stock_quantity (stock_quantity),
  INDEX idx_products_is_active (is_active),
  INDEX idx_products_is_featured (is_featured),
  INDEX idx_products_price (price),
  INDEX idx_products_brand (brand),
  INDEX idx_products_sku_active (sku, is_active),
  INDEX idx_products_category_active (category_id, is_active),
  INDEX idx_products_active_featured (is_active, is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_digest VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date DATE,
  email_verified_at TIMESTAMP NULL,
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_password_reset_token (password_reset_token),
  INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 住所テーブル
CREATE TABLE IF NOT EXISTS addresses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  prefecture VARCHAR(50) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user_id (user_id),
  INDEX idx_addresses_user_id_is_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 注文テーブル
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50) NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_name VARCHAR(255) NULL,
  shipping_postal_code VARCHAR(10) NULL,
  shipping_prefecture VARCHAR(50) NULL,
  shipping_city VARCHAR(100) NULL,
  shipping_address_line1 VARCHAR(255) NULL,
  shipping_address_line2 VARCHAR(255) NULL,
  shipping_phone VARCHAR(20) NULL,
  notes TEXT NULL,
  admin_notes TEXT NULL,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_order_number (order_number),
  INDEX idx_orders_status (status),
  INDEX idx_orders_payment_status (payment_status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 注文明細テーブル
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(255) NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- カートテーブル
CREATE TABLE IF NOT EXISTS carts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_carts_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- カート商品テーブル
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_cart_items_cart_id (cart_id),
  INDEX idx_cart_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 在庫変動ログ
CREATE TABLE IF NOT EXISTS inventory_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  admin_id BIGINT UNSIGNED NULL,
  type ENUM('adjustment', 'sale', 'restock', 'return') NOT NULL DEFAULT 'adjustment',
  quantity_change INT NOT NULL,
  quantity_before INT NOT NULL DEFAULT 0,
  quantity_after INT NOT NULL,
  reason VARCHAR(255),
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_inventory_logs_product_id (product_id),
  INDEX idx_inventory_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- デフォルト管理者を作成（パスワード: admin123）
INSERT INTO admins (name, email, password, role, is_active) VALUES
('Super Admin', 'admin@example.com', '$2y$12$LReqEPD7wQCAQsBOqHlVoOZHFMLZpjmDHfu6OBjdvUEb4GjGN3a3a', 'super_admin', TRUE)
ON DUPLICATE KEY UPDATE name = name;
