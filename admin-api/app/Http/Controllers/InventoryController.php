<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:admin');
        $this->middleware('check.permission:manage_products');
    }
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::with('category:id,name,slug');

            if ($request->has('category_id')) {
                $query->byCategory($request->category_id);
            }

            if ($request->has('stock_status')) {
                switch ($request->stock_status) {
                    case 'in_stock':
                        $query->inStock();
                        break;
                    case 'low_stock':
                        $query->lowStock();
                        break;
                    case 'out_of_stock':
                        $query->where('stock_quantity', '<=', 0);
                        break;
                }
            }

            if ($request->has('search')) {
                $query->search($request->search);
            }

            $sortBy = $request->get('sort_by', 'stock_quantity');
            $sortOrder = in_array($request->get('sort_order', 'asc'), ['asc', 'desc']) ? $request->get('sort_order', 'asc') : 'asc';

            $allowedSortFields = ['name', 'sku', 'stock_quantity', 'low_stock_threshold', 'updated_at'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder);
            }

            $products = $query->paginate($request->get('per_page', 15));

            $metrics = $this->getInventoryMetrics();

            return $this->successResponse('Inventory retrieved successfully', [
                'products' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ],
                'metrics' => $metrics
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve inventory', $e->getMessage(), 500);
        }
    }
    public function updateStock(Request $request, int $productId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'operation' => 'required|string|in:add,subtract,set',
                'quantity' => 'required|integer|min:0',
                'reason' => 'required|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $product = Product::findOrFail($productId);

            DB::beginTransaction();

            try {
                $oldQuantity = $product->stock_quantity;
                $newQuantity = $oldQuantity;
                $quantityChange = 0;

                switch ($request->operation) {
                    case 'add':
                        $newQuantity = $oldQuantity + $request->quantity;
                        $quantityChange = $request->quantity;
                        break;
                    case 'subtract':
                        $newQuantity = max(0, $oldQuantity - $request->quantity);
                        $quantityChange = -($oldQuantity - $newQuantity);
                        break;
                    case 'set':
                        $newQuantity = $request->quantity;
                        $quantityChange = $newQuantity - $oldQuantity;
                        break;
                }

                $product->update(['stock_quantity' => $newQuantity]);

                InventoryLog::create([
                    'product_id' => $product->id,
                    'admin_id' => auth('admin')->id(),
                    'quantity_change' => $quantityChange,
                    'quantity_after' => $newQuantity,
                    'reason' => $request->reason,
                    'notes' => $request->notes,
                ]);

                DB::commit();

                return $this->successResponse('Stock updated successfully', [
                    'product' => $product->only(['id', 'name', 'sku', 'stock_quantity', 'stock_status']),
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $newQuantity,
                    'change' => $quantityChange
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update stock', $e->getMessage(), 500);
        }
    }
    public function bulkUpdateStock(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'updates' => 'required|array|min:1',
                'updates.*.product_id' => 'required|exists:products,id',
                'updates.*.operation' => 'required|string|in:add,subtract,set',
                'updates.*.quantity' => 'required|integer|min:0',
                'reason' => 'required|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            DB::beginTransaction();

            try {
                $updatedProducts = [];
                $failedUpdates = [];

                foreach ($request->updates as $update) {
                    try {
                        $product = Product::findOrFail($update['product_id']);
                        $oldQuantity = $product->stock_quantity;
                        $newQuantity = $oldQuantity;
                        $quantityChange = 0;

                        switch ($update['operation']) {
                            case 'add':
                                $newQuantity = $oldQuantity + $update['quantity'];
                                $quantityChange = $update['quantity'];
                                break;
                            case 'subtract':
                                $newQuantity = max(0, $oldQuantity - $update['quantity']);
                                $quantityChange = -($oldQuantity - $newQuantity);
                                break;
                            case 'set':
                                $newQuantity = $update['quantity'];
                                $quantityChange = $newQuantity - $oldQuantity;
                                break;
                        }

                        $product->update(['stock_quantity' => $newQuantity]);

                        InventoryLog::create([
                            'product_id' => $product->id,
                            'admin_id' => auth('admin')->id(),
                            'quantity_change' => $quantityChange,
                            'quantity_after' => $newQuantity,
                            'reason' => $request->reason,
                            'notes' => $request->notes,
                        ]);

                        $updatedProducts[] = [
                            'product_id' => $product->id,
                            'name' => $product->name,
                            'sku' => $product->sku,
                            'old_quantity' => $oldQuantity,
                            'new_quantity' => $newQuantity,
                            'change' => $quantityChange
                        ];

                    } catch (\Exception $e) {
                        $failedUpdates[] = [
                            'product_id' => $update['product_id'],
                            'error' => $e->getMessage()
                        ];
                    }
                }

                DB::commit();

                return $this->successResponse('Bulk stock update completed', [
                    'updated_products' => $updatedProducts,
                    'failed_updates' => $failedUpdates,
                    'total_updated' => count($updatedProducts),
                    'total_failed' => count($failedUpdates)
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to bulk update stock', $e->getMessage(), 500);
        }
    }
    public function productLogs(Request $request, int $productId): JsonResponse
    {
        try {
            $product = Product::findOrFail($productId);

            $query = $product->inventoryLogs()->with('admin:id,name,email');

            if ($request->has('date_from')) {
                $query->where('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('created_at', '<=', $request->date_to);
            }

            if ($request->has('reason')) {
                $query->where('reason', 'like', '%' . $request->reason . '%');
            }

            $logs = $query->orderBy('created_at', 'desc')
                         ->paginate($request->get('per_page', 15));

            return $this->successResponse('Inventory logs retrieved successfully', [
                'product' => $product->only(['id', 'name', 'sku', 'stock_quantity']),
                'logs' => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->errorResponse('Product not found', null, 404);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve inventory logs', $e->getMessage(), 500);
        }
    }
    public function logs(Request $request): JsonResponse
    {
        try {
            $query = InventoryLog::with(['product:id,name,sku', 'admin:id,name,email']);

            if ($request->has('product_id')) {
                $query->where('product_id', $request->product_id);
            }

            if ($request->has('admin_id')) {
                $query->where('admin_id', $request->admin_id);
            }

            if ($request->has('date_from')) {
                $query->where('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('created_at', '<=', $request->date_to);
            }

            if ($request->has('reason')) {
                $query->where('reason', 'like', '%' . $request->reason . '%');
            }

            $logs = $query->orderBy('created_at', 'desc')
                         ->paginate($request->get('per_page', 15));

            return $this->successResponse('Inventory logs retrieved successfully', [
                'logs' => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve inventory logs', $e->getMessage(), 500);
        }
    }
    public function lowStockAlerts(Request $request): JsonResponse
    {
        try {
            $query = Product::with('category:id,name,slug')
                           ->lowStock()
                           ->active();

            if ($request->has('category_id')) {
                $query->byCategory($request->category_id);
            }

            $products = $query->orderBy('stock_quantity', 'asc')
                             ->paginate($request->get('per_page', 15));

            return $this->successResponse('Low stock alerts retrieved successfully', [
                'products' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve low stock alerts', $e->getMessage(), 500);
        }
    }
    public function export(Request $request)
    {
        try {
            $query = Product::with('category:id,name');

            if ($request->has('category_id')) {
                $query->byCategory($request->category_id);
            }

            if ($request->has('stock_status')) {
                switch ($request->stock_status) {
                    case 'in_stock':
                        $query->inStock();
                        break;
                    case 'low_stock':
                        $query->lowStock();
                        break;
                    case 'out_of_stock':
                        $query->where('stock_quantity', '<=', 0);
                        break;
                }
            }

            $products = $query->orderBy('name')->get();

            $filename = 'inventory_report_' . now()->format('Y-m-d_H-i-s') . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function() use ($products) {
                $file = fopen('php://output', 'w');
                
                fputcsv($file, [
                    'SKU',
                    'Product Name',
                    'Category',
                    'Current Stock',
                    'Low Stock Threshold',
                    'Stock Status',
                    'Price',
                    'Cost Price',
                    'Total Value (Cost)',
                    'Total Value (Retail)',
                    'Last Updated'
                ]);

                foreach ($products as $product) {
                    $totalCostValue = $product->cost_price ? $product->stock_quantity * $product->cost_price : 0;
                    $totalRetailValue = $product->stock_quantity * $product->price;

                    fputcsv($file, [
                        $product->sku,
                        $product->name,
                        $product->category->name ?? 'N/A',
                        $product->stock_quantity,
                        $product->low_stock_threshold,
                        $product->stock_status,
                        $product->price,
                        $product->cost_price ?? 'N/A',
                        number_format($totalCostValue, 2),
                        number_format($totalRetailValue, 2),
                        $product->updated_at->toDateTimeString(),
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to export inventory', $e->getMessage(), 500);
        }
    }
    public function valuation(Request $request): JsonResponse
    {
        try {
            $query = Product::active();

            if ($request->has('category_id')) {
                $query->byCategory($request->category_id);
            }

            $products = $query->get();

            $valuation = [
                'total_products' => $products->count(),
                'total_stock_units' => $products->sum('stock_quantity'),
                'total_cost_value' => 0,
                'total_retail_value' => 0,
                'categories' => []
            ];

            foreach ($products as $product) {
                $stockValue = $product->stock_quantity * $product->price;
                $costValue = $product->cost_price ? $product->stock_quantity * $product->cost_price : 0;

                $valuation['total_retail_value'] += $stockValue;
                $valuation['total_cost_value'] += $costValue;

                $categoryName = $product->category->name ?? 'Uncategorized';
                if (!isset($valuation['categories'][$categoryName])) {
                    $valuation['categories'][$categoryName] = [
                        'products_count' => 0,
                        'stock_units' => 0,
                        'cost_value' => 0,
                        'retail_value' => 0
                    ];
                }

                $valuation['categories'][$categoryName]['products_count']++;
                $valuation['categories'][$categoryName]['stock_units'] += $product->stock_quantity;
                $valuation['categories'][$categoryName]['cost_value'] += $costValue;
                $valuation['categories'][$categoryName]['retail_value'] += $stockValue;
            }

            $valuation['potential_profit'] = $valuation['total_retail_value'] - $valuation['total_cost_value'];
            $valuation['profit_margin'] = $valuation['total_retail_value'] > 0 
                ? (($valuation['potential_profit'] / $valuation['total_retail_value']) * 100) 
                : 0;

            return $this->successResponse('Inventory valuation calculated successfully', [
                'valuation' => $valuation
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to calculate inventory valuation', $e->getMessage(), 500);
        }
    }
    public function statistics(): JsonResponse
    {
        try {
            $metrics = $this->getInventoryMetrics();

            $totalRetailValue = Product::active()
                ->selectRaw('SUM(stock_quantity * price) as total_value')
                ->value('total_value') ?? 0;

            return $this->successResponse('Inventory statistics retrieved successfully', [
                'total_products' => $metrics['total_products'],
                'low_stock_products' => $metrics['low_stock_products'],
                'out_of_stock_products' => $metrics['out_of_stock_products'],
                'total_inventory_value' => $totalRetailValue,
                'metrics' => $metrics,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve inventory statistics', $e->getMessage(), 500);
        }
    }

    private function getInventoryMetrics(): array
    {
        $totalProducts = Product::count();
        $activeProducts = Product::active()->count();
        $inStockProducts = Product::inStock()->count();
        $lowStockProducts = Product::lowStock()->count();
        $outOfStockProducts = Product::where('stock_quantity', '<=', 0)->count();

        return [
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'in_stock_products' => $inStockProducts,
            'low_stock_products' => $lowStockProducts,
            'out_of_stock_products' => $outOfStockProducts,
            'stock_distribution' => [
                'in_stock_percentage' => $totalProducts > 0 ? round(($inStockProducts / $totalProducts) * 100, 2) : 0,
                'low_stock_percentage' => $totalProducts > 0 ? round(($lowStockProducts / $totalProducts) * 100, 2) : 0,
                'out_of_stock_percentage' => $totalProducts > 0 ? round(($outOfStockProducts / $totalProducts) * 100, 2) : 0,
            ]
        ];
    }

}