<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:admin');
        $this->middleware('check.permission:manage_products');
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::with(['category:id,name,slug']);

            // フィルター条件
            if ($request->has('category_id')) {
                $query->byCategory($request->category_id);
            }

            if ($request->has('is_active')) {
                if ($request->boolean('is_active')) {
                    $query->active();
                } else {
                    $query->where('is_active', false);
                }
            }

            if ($request->has('is_featured')) {
                $query->featured();
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

            if ($request->has('min_price') && $request->has('max_price')) {
                $query->priceRange($request->min_price, $request->max_price);
            }

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = in_array($request->get('sort_order', 'desc'), ['asc', 'desc']) ? $request->get('sort_order', 'desc') : 'desc';

            $allowedSortFields = ['id', 'name', 'price', 'stock_quantity', 'created_at', 'updated_at'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder);
            }

            $products = $query->paginate($request->get('per_page', 15));

            return $this->successResponse('Products retrieved successfully', [
                'products' => $products->items(),
                'pagination' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'per_page' => $products->perPage(),
                    'total' => $products->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve products', $e->getMessage(), 500);
        }
    }

    // 商品登録。バリデーションは今後もう少し厳密にする予定
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'short_description' => 'nullable|string|max:500',
                'sku' => 'required|string|max:100|unique:products,sku',
                'price' => 'required|numeric|min:0',
                'sale_price' => 'nullable|numeric|min:0|lt:price',
                'cost_price' => 'nullable|numeric|min:0',
                'stock_quantity' => 'required|integer|min:0',
                'low_stock_threshold' => 'nullable|integer|min:0',
                'category_id' => 'required|exists:categories,id',
                'brand' => 'nullable|string|max:255',
                'color' => 'nullable|string|max:100',
                'size' => 'nullable|string|max:100',
                'material' => 'nullable|string|max:255',
                'is_active' => 'boolean',
                'is_featured' => 'boolean',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'tags' => 'nullable|array',
                'images' => 'nullable|array|max:10',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'custom_attributes' => 'nullable|json',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            DB::beginTransaction();

            try {
                $imagePaths = [];
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $image) {
                        $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                        $path = $image->storeAs('products', $filename, 'public');
                        $imagePaths[] = $path;
                    }
                }

                $productData = array_merge($request->all(), [
                    'images' => $imagePaths,
                    'is_active' => $request->boolean('is_active', true),
                    'is_featured' => $request->boolean('is_featured', false),
                    'low_stock_threshold' => $request->get('low_stock_threshold', 10),
                ]);

                $product = Product::create($productData);

                $product->inventoryLogs()->create([
                    'quantity_change' => $product->stock_quantity,
                    'quantity_after' => $product->stock_quantity,
                    'reason' => 'Initial stock',
                    'admin_id' => auth('admin')->id(),
                ]);

                DB::commit();

                $product->load('category:id,name,slug');

                return $this->successResponse('Product created successfully', [
                    'product' => $product
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                
                // 失敗時にアップロード済み画像を削除
                foreach ($imagePaths as $path) {
                    Storage::disk('public')->delete($path);
                }
                
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create product', $e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::with([
            'category:id,name,slug',
            'inventoryLogs' => function ($query) {
                $query->with('admin:id,name')->latest()->limit(10);
            }
        ])->findOrFail($id);

        $product->total_sales = $product->getTotalSales();
        $product->total_revenue = $product->getTotalRevenue();
        $product->profit_margin = $product->getProfitMargin();

        return $this->successResponse('Product retrieved successfully', [
            'product' => $product
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'short_description' => 'nullable|string|max:500',
                'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $id,
                'price' => 'sometimes|required|numeric|min:0',
                'sale_price' => 'nullable|numeric|min:0|lt:price',
                'cost_price' => 'nullable|numeric|min:0',
                'stock_quantity' => 'sometimes|required|integer|min:0',
                'low_stock_threshold' => 'nullable|integer|min:0',
                'category_id' => 'sometimes|required|exists:categories,id',
                'brand' => 'nullable|string|max:255',
                'color' => 'nullable|string|max:100',
                'size' => 'nullable|string|max:100',
                'material' => 'nullable|string|max:255',
                'is_active' => 'boolean',
                'is_featured' => 'boolean',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'tags' => 'nullable|array',
                'new_images' => 'nullable|array|max:10',
                'new_images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'remove_images' => 'nullable|array',
                'custom_attributes' => 'nullable|json',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            DB::beginTransaction();

            try {
                $currentImages = $product->images ?? [];
                $updatedImages = $currentImages;

                if ($request->has('remove_images')) {
                    foreach ($request->remove_images as $imageToRemove) {
                        if (($key = array_search($imageToRemove, $updatedImages)) !== false) {
                            unset($updatedImages[$key]);
                            Storage::disk('public')->delete($imageToRemove);
                        }
                    }
                    $updatedImages = array_values($updatedImages);
                }

                if ($request->hasFile('new_images')) {
                    foreach ($request->file('new_images') as $image) {
                        $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                        $path = $image->storeAs('products', $filename, 'public');
                        $updatedImages[] = $path;
                    }
                }

                // 在庫変動を追跡
                $oldStock = $product->stock_quantity;
                $newStock = $request->get('stock_quantity', $oldStock);

                $updateData = $request->except(['new_images', 'remove_images']);
                $updateData['images'] = $updatedImages;

                $product->update($updateData);

                // 在庫変動を記録
                if ($newStock !== $oldStock) {
                    $quantityChange = $newStock - $oldStock;
                    $product->inventoryLogs()->create([
                        'quantity_change' => $quantityChange,
                        'quantity_after' => $newStock,
                        'reason' => 'Manual adjustment',
                        'admin_id' => auth('admin')->id(),
                    ]);
                }

                DB::commit();

                $product->load('category:id,name,slug');

                return $this->successResponse('Product updated successfully', [
                    'product' => $product
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update product', $e->getMessage(), 500);
        }
    }

    // 商品を削除。注文に紐づいている商品は削除不可
    public function destroy(int $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);

            if ($product->orderItems()->exists()) {
                return $this->errorResponse('Cannot delete product with existing orders', null, 400);
            }

            DB::beginTransaction();

            try {
                if ($product->images) {
                    foreach ($product->images as $image) {
                        Storage::disk('public')->delete($image);
                    }
                }

                $product->delete();

                DB::commit();

                return $this->successResponse('Product deleted successfully');

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete product', $e->getMessage(), 500);
        }
    }

    public function bulkUpdateStock(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'products' => 'required|array|min:1',
                'products.*.id' => 'required|exists:products,id',
                'products.*.stock_quantity' => 'required|integer|min:0',
                'reason' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            DB::beginTransaction();

            try {
                $updatedProducts = [];
                $reason = $request->get('reason', 'Bulk stock update');

                foreach ($request->products as $productData) {
                    $product = Product::findOrFail($productData['id']);
                    $oldStock = $product->stock_quantity;
                    $newStock = $productData['stock_quantity'];

                    if ($oldStock !== $newStock) {
                        $product->update(['stock_quantity' => $newStock]);

                        // 在庫変動を記録
                        $quantityChange = $newStock - $oldStock;
                        $product->inventoryLogs()->create([
                            'quantity_change' => $quantityChange,
                            'quantity_after' => $newStock,
                            'reason' => $reason,
                            'admin_id' => auth('admin')->id(),
                        ]);

                        $updatedProducts[] = $product->only(['id', 'name', 'sku', 'stock_quantity']);
                    }
                }

                DB::commit();

                return $this->successResponse('Stock updated successfully', [
                    'updated_products' => $updatedProducts,
                    'total_updated' => count($updatedProducts)
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update stock', $e->getMessage(), 500);
        }
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update(['is_active' => !$product->is_active]);

        return $this->successResponse('Product status updated successfully', [
            'product' => $product->only(['id', 'name', 'is_active'])
        ]);
    }

    public function analytics(int $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);

            $analytics = [
                'total_sales' => $product->getTotalSales(),
                'total_revenue' => $product->getTotalRevenue(),
                'profit_margin' => $product->getProfitMargin(),
                'current_stock' => $product->stock_quantity,
                'stock_status' => $product->stock_status,
                'is_low_stock' => $product->is_low_stock,
                'views' => 0,
                'conversion_rate' => 0,
            ];

            // 直近30日間の売上推移を取得
            $salesOverTime = $product->orderItems()
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(quantity) as quantity'), DB::raw('SUM(total) as revenue'))
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return $this->successResponse('Product analytics retrieved successfully', [
                'product' => $product->only(['id', 'name', 'sku']),
                'analytics' => $analytics,
                'sales_over_time' => $salesOverTime
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve product analytics', $e->getMessage(), 500);
        }
    }

    public function uploadImage(Request $request, int $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $image = $request->file('image');
            $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('products', $filename, 'public');

            $images = $product->images ?? [];
            $images[] = $path;
            $product->update(['images' => $images]);

            return $this->successResponse('Image uploaded successfully', [
                'product' => $product->fresh()->load('category:id,name,slug'),
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to upload image', $e->getMessage(), 500);
        }
    }

    public function deleteImage(int $id, int $imageIndex): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
            $images = $product->images ?? [];

            if (!isset($images[$imageIndex])) {
                return $this->errorResponse('Image not found', null, 404);
            }

            Storage::disk('public')->delete($images[$imageIndex]);
            array_splice($images, $imageIndex, 1);
            $product->update(['images' => $images]);

            return $this->successResponse('Image deleted successfully', [
                'product' => $product->fresh()->load('category:id,name,slug'),
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete image', $e->getMessage(), 500);
        }
    }

}