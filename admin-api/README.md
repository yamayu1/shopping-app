# Shopping App Admin API

A comprehensive Laravel-based admin API system for managing a shopping application. Built with JWT authentication, SOLID principles, and clean architecture.

## Features

- **JWT Authentication** for admin users with role-based access control
- **Product Management** with image uploads and inventory tracking
- **Category Management** with hierarchical structure
- **Order Management** with status tracking and bulk operations
- **Inventory Management** with stock alerts and CSV exports
- **Performance Optimizations** with database indexing and eager loading
- **Security Best Practices** including CORS, input validation, and SQL injection prevention
- **Clean Architecture** following SOLID principles

## Admin Roles

- **Super Admin**: Full system access including admin user management
- **Admin**: Access to all features except admin user management
- **Manager**: Product, category, order, and inventory management
- **Editor**: Product and category management only

## Installation

1. **Install dependencies**:
   ```bash
   composer install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   php artisan jwt:secret
   ```

3. **Database setup**:
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

4. **Storage setup**:
   ```bash
   php artisan storage:link
   ```

5. **Start the server**:
   ```bash
   php artisan serve --port=8001
   ```

## Environment Variables

Update your `.env` file with the following configurations:

```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=shopping_app
DB_USERNAME=root
DB_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_TTL=60
JWT_REFRESH_TTL=20160

# CORS
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

## API Endpoints

### Authentication

- `POST /api/admin/login` - Admin login
- `POST /api/admin/auth/logout` - Logout
- `POST /api/admin/auth/refresh` - Refresh token
- `GET /api/admin/auth/me` - Get current admin profile
- `PUT /api/admin/auth/profile` - Update profile
- `PUT /api/admin/auth/password` - Change password

### Products

- `GET /api/admin/products` - List products with filters
- `POST /api/admin/products` - Create product
- `GET /api/admin/products/{id}` - Get product details
- `PUT /api/admin/products/{id}` - Update product
- `DELETE /api/admin/products/{id}` - Delete product
- `PUT /api/admin/products/{id}/toggle-status` - Toggle product status
- `GET /api/admin/products/{id}/analytics` - Product analytics
- `PUT /api/admin/products/bulk/stock` - Bulk stock update

### Categories

- `GET /api/admin/categories` - List categories (supports tree view)
- `POST /api/admin/categories` - Create category
- `GET /api/admin/categories/{id}` - Get category details
- `PUT /api/admin/categories/{id}` - Update category
- `DELETE /api/admin/categories/{id}` - Delete category
- `PUT /api/admin/categories/{id}/toggle-status` - Toggle category status
- `PUT /api/admin/categories/{id}/move` - Move category to different parent
- `PUT /api/admin/categories/sort-order` - Update sort orders

### Orders

- `GET /api/admin/orders` - List orders with filters
- `GET /api/admin/orders/statistics` - Order statistics
- `GET /api/admin/orders/export` - Export orders to CSV
- `GET /api/admin/orders/{orderNumber}` - Get order details
- `PUT /api/admin/orders/{orderNumber}/status` - Update order status
- `PUT /api/admin/orders/{orderNumber}/payment-status` - Update payment status
- `PUT /api/admin/orders/bulk/status` - Bulk status update

### Inventory

- `GET /api/admin/inventory` - Inventory overview
- `GET /api/admin/inventory/logs` - Inventory logs
- `GET /api/admin/inventory/low-stock` - Low stock alerts
- `GET /api/admin/inventory/export` - Export inventory to CSV
- `GET /api/admin/inventory/valuation` - Inventory valuation
- `PUT /api/admin/inventory/products/{productId}/stock` - Update stock
- `GET /api/admin/inventory/products/{productId}/logs` - Product inventory logs
- `PUT /api/admin/inventory/bulk/stock` - Bulk stock update

### Dashboard

- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/recent-orders` - Recent orders
- `GET /api/admin/dashboard/top-products` - Top selling products
- `GET /api/admin/dashboard/sales-chart` - Sales chart data

## Default Admin Users

After running the seeder, the following admin users will be available:

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | password123 | Super Admin |
| admin@example.com | password123 | Admin |
| manager@example.com | password123 | Manager |
| editor@example.com | password123 | Editor |

## Commands

### Inventory Export Command

Export inventory data for scheduled reports:

```bash
# Basic CSV export
php artisan inventory:export

# Export with filters
php artisan inventory:export --format=json --category=1 --status=low_stock

# Export to custom path
php artisan inventory:export --path=/custom/path

# Export and email
php artisan inventory:export --email=admin@example.com
```

Options:
- `--format`: Export format (csv, json)
- `--category`: Filter by category ID
- `--status`: Filter by stock status (in_stock, low_stock, out_of_stock)
- `--path`: Custom export path
- `--email`: Email address to send export to

## Security Features

- **JWT Authentication** with token refresh and blacklisting
- **Role-based Access Control** with permission middleware
- **CORS Protection** with configurable allowed origins
- **Input Validation** on all endpoints
- **SQL Injection Prevention** using Eloquent ORM
- **File Upload Security** with type and size validation
- **Password Hashing** using bcrypt
- **Rate Limiting** on API endpoints

## Performance Optimizations

- **Database Indexing** on frequently queried columns
- **Eager Loading** to prevent N+1 queries
- **Pagination** for large datasets
- **Full-text Search** indexes for product search
- **Optimized Queries** with proper relationships
- **Caching** ready for Redis implementation

## Database Schema

The system uses the following main tables:

- `admins` - Admin users with roles
- `categories` - Hierarchical product categories
- `products` - Product catalog with inventory
- `orders` - Customer orders
- `order_items` - Order line items
- `inventory_logs` - Stock movement tracking
- `users` - Customer accounts (shared with Rails API)
- `carts` - Shopping carts
- `cart_items` - Cart line items

## File Structure

```
admin-api/
├── app/
│   ├── Console/Commands/
│   │   └── ExportInventory.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── ProductController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── OrderController.php
│   │   │   └── InventoryController.php
│   │   ├── Middleware/
│   │   │   ├── CheckPermission.php
│   │   │   └── Cors.php
│   │   └── Kernel.php
│   ├── Models/
│   │   ├── Admin.php
│   │   ├── Product.php
│   │   ├── Category.php
│   │   ├── Order.php
│   │   └── ...
│   └── Providers/
├── config/
│   ├── auth.php
│   ├── database.php
│   ├── jwt.php
│   └── cors.php
├── database/
│   ├── migrations/
│   └── seeders/
└── routes/
    └── api.php
```

## API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    // Validation errors or additional error details
  }
}
```

## License

This project is licensed under the MIT License.