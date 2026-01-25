<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| APIルート
|--------------------------------------------------------------------------
|
| アプリケーションのAPIルートを定義します。
| RouteServiceProviderによって読み込まれ、
| すべて「api」ミドルウェアグループに割り当てられます。
|
*/

// 公開ルート
Route::prefix('admin')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// 認証済み管理者ルート
Route::prefix('admin')->middleware(['auth:admin'])->group(function () {
    
    // 認証ルート
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        
        // 管理者管理（スーパー管理者のみ）
        Route::post('/register', [AuthController::class, 'register']);
        Route::get('/admins', [AuthController::class, 'getAdmins']);
        Route::put('/admins/{adminId}/status', [AuthController::class, 'updateAdminStatus']);
    });

    // 商品管理ルート
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);

        // 一括操作
        Route::put('/bulk/stock', [ProductController::class, 'bulkUpdateStock']);

        Route::get('/{id}', [ProductController::class, 'show']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
        Route::put('/{id}/toggle-status', [ProductController::class, 'toggleStatus']);
        Route::get('/{id}/analytics', [ProductController::class, 'analytics']);
        Route::post('/{id}/images', [ProductController::class, 'uploadImage']);
        Route::delete('/{id}/images/{imageIndex}', [ProductController::class, 'deleteImage']);
    });

    // カテゴリ管理ルート
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::post('/', [CategoryController::class, 'store']);

        // 並び替え
        Route::put('/sort-order', [CategoryController::class, 'updateSortOrder']);

        Route::get('/{id}', [CategoryController::class, 'show']);
        Route::put('/{id}', [CategoryController::class, 'update']);
        Route::delete('/{id}', [CategoryController::class, 'destroy']);
        Route::put('/{id}/toggle-status', [CategoryController::class, 'toggleStatus']);
        Route::put('/{id}/move', [CategoryController::class, 'move']);
        Route::get('/{id}/analytics', [CategoryController::class, 'analytics']);
    });

    // 注文管理ルート
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/statistics', [OrderController::class, 'statistics']);
        Route::get('/export', [OrderController::class, 'export']);

        // 一括操作
        Route::put('/bulk/status', [OrderController::class, 'bulkUpdateStatus']);

        Route::get('/{orderNumber}', [OrderController::class, 'show']);
        Route::put('/{orderNumber}/status', [OrderController::class, 'updateStatus']);
        Route::put('/{orderNumber}/payment-status', [OrderController::class, 'updatePaymentStatus']);
    });

    // 在庫管理ルート
    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::get('/logs', [InventoryController::class, 'logs']);
        Route::get('/low-stock', [InventoryController::class, 'lowStockAlerts']);
        Route::get('/export', [InventoryController::class, 'export']);
        Route::get('/valuation', [InventoryController::class, 'valuation']);
        Route::put('/products/{productId}/stock', [InventoryController::class, 'updateStock']);
        Route::get('/products/{productId}/logs', [InventoryController::class, 'productLogs']);
        
        Route::get('/statistics', [InventoryController::class, 'statistics']);

        // 一括操作
        Route::put('/bulk/stock', [InventoryController::class, 'bulkUpdateStock']);
    });

    // ユーザー管理ルート
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/statistics', [UserController::class, 'statistics']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}/status', [UserController::class, 'updateStatus']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
        Route::get('/{id}/orders', [UserController::class, 'getUserOrders']);
    });

    // ダッシュボード・分析ルート
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', function () {
            try {
                $stats = [
                    'products' => [
                        'total' => \App\Models\Product::count(),
                        'active' => \App\Models\Product::active()->count(),
                        'low_stock' => \App\Models\Product::lowStock()->count(),
                        'out_of_stock' => \App\Models\Product::where('stock_quantity', '<=', 0)->count(),
                    ],
                    'categories' => [
                        'total' => \App\Models\Category::count(),
                        'active' => \App\Models\Category::active()->count(),
                    ],
                    'orders' => [
                        'total' => \App\Models\Order::count(),
                        'pending' => \App\Models\Order::where('status', 'pending')->count(),
                        'processing' => \App\Models\Order::where('status', 'processing')->count(),
                        'shipped' => \App\Models\Order::where('status', 'shipped')->count(),
                        'delivered' => \App\Models\Order::where('status', 'delivered')->count(),
                    ],
                    'revenue' => [
                        'total' => \App\Models\Order::sum('total_amount'),
                        'this_month' => \App\Models\Order::whereYear('created_at', now()->year)
                            ->whereMonth('created_at', now()->month)->sum('total_amount'),
                        'last_month' => \App\Models\Order::whereYear('created_at', now()->subMonth()->year)
                            ->whereMonth('created_at', now()->subMonth()->month)->sum('total_amount'),
                    ]
                ];

                return response()->json([
                    'success' => true,
                    'message' => 'Dashboard statistics retrieved successfully',
                    'data' => ['stats' => $stats]
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve dashboard statistics',
                    'errors' => $e->getMessage()
                ], 500);
            }
        });

        Route::get('/recent-orders', function (Request $request) {
            try {
                $orders = \App\Models\Order::with(['user:id,name,email'])
                    ->orderBy('created_at', 'desc')
                    ->limit($request->get('limit', 10))
                    ->get();

                return response()->json([
                    'success' => true,
                    'message' => 'Recent orders retrieved successfully',
                    'data' => ['orders' => $orders]
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve recent orders',
                    'errors' => $e->getMessage()
                ], 500);
            }
        });

        Route::get('/top-products', function (Request $request) {
            try {
                $products = \App\Models\Product::select('products.*')
                    ->join('order_items', 'products.id', '=', 'order_items.product_id')
                    ->selectRaw('SUM(order_items.quantity) as total_sold')
                    ->selectRaw('SUM(order_items.total) as total_revenue')
                    ->groupBy('products.id')
                    ->orderBy('total_sold', 'desc')
                    ->limit($request->get('limit', 10))
                    ->get();

                return response()->json([
                    'success' => true,
                    'message' => 'Top products retrieved successfully',
                    'data' => ['products' => $products]
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve top products',
                    'errors' => $e->getMessage()
                ], 500);
            }
        });

        Route::get('/sales-chart', function (Request $request) {
            try {
                $days = $request->get('days', 30);
                $salesData = \App\Models\Order::select(\DB::raw('DATE(created_at) as date'))
                    ->selectRaw('COUNT(*) as orders')
                    ->selectRaw('SUM(total_amount) as revenue')
                    ->where('created_at', '>=', now()->subDays($days))
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get();

                return response()->json([
                    'success' => true,
                    'message' => 'Sales chart data retrieved successfully',
                    'data' => ['sales_data' => $salesData]
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve sales chart data',
                    'errors' => $e->getMessage()
                ], 500);
            }
        });
    });
});

// ヘルスチェック用ルート
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'service' => 'Admin API',
        'version' => '1.0.0'
    ]);
});

// APIドキュメント用キャッチオールルート
Route::get('/', function () {
    return response()->json([
        'message' => 'Shopping App Admin API',
        'version' => '1.0.0',
        'documentation' => '/api/docs',
        'endpoints' => [
            'authentication' => '/api/admin/auth/*',
            'products' => '/api/admin/products/*',
            'categories' => '/api/admin/categories/*',
            'orders' => '/api/admin/orders/*',
            'inventory' => '/api/admin/inventory/*',
            'dashboard' => '/api/admin/dashboard/*',
        ]
    ]);
});

// 404用フォールバックルート
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found',
        'error' => 'The requested API endpoint does not exist'
    ], 404);
});