<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:admin');
        $this->middleware('check.permission:manage_products');
    }
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Category::query();

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

            if ($request->has('search')) {
                $query->search($request->search);
            }

            $categories = $query->ordered()->paginate($request->get('per_page', 15));

            return $this->successResponse('Categories retrieved successfully', [
                'categories' => $categories->items(),
                'pagination' => [
                    'current_page' => $categories->currentPage(),
                    'last_page' => $categories->lastPage(),
                    'per_page' => $categories->perPage(),
                    'total' => $categories->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve categories', $e->getMessage(), 500);
        }
    }
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|unique:categories,slug',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'icon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:1024',
                'sort_order' => 'nullable|integer|min:0',
                'is_active' => 'boolean',
                'is_featured' => 'boolean',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'custom_attributes' => 'nullable|json',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            DB::beginTransaction();

            try {
                // スラグが未入力の場合は自動生成
                $slug = $request->slug ?? Str::slug($request->name);

                // スラグの一意性を保証
                $originalSlug = $slug;
                $counter = 1;
                while (Category::where('slug', $slug)->exists()) {
                    $slug = $originalSlug . '-' . $counter;
                    $counter++;
                }

                // 画像アップロードを処理
                $imagePath = null;
                if ($request->hasFile('image')) {
                    $image = $request->file('image');
                    $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                    $imagePath = $image->storeAs('categories/images', $filename, 'public');
                }

                // アイコンアップロードを処理
                $iconPath = null;
                if ($request->hasFile('icon')) {
                    $icon = $request->file('icon');
                    $filename = time() . '_' . Str::random(10) . '.' . $icon->getClientOriginalExtension();
                    $iconPath = $icon->storeAs('categories/icons', $filename, 'public');
                }

                // 並び順が未指定の場合は次の順番を取得
                $sortOrder = $request->sort_order;
                if ($sortOrder === null) {
                    $maxSort = Category::max('sort_order') ?? 0;
                    $sortOrder = $maxSort + 1;
                }

                $categoryData = array_merge($request->except(['image', 'icon']), [
                    'slug' => $slug,
                    'image' => $imagePath,
                    'icon' => $iconPath,
                    'sort_order' => $sortOrder,
                    'is_active' => $request->boolean('is_active', true),
                    'is_featured' => $request->boolean('is_featured', false),
                ]);

                $category = Category::create($categoryData);

                DB::commit();

                return $this->successResponse('Category created successfully', [
                    'category' => $category
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                
                // 失敗時にアップロードファイルをクリーンアップ
                if ($imagePath) Storage::disk('public')->delete($imagePath);
                if ($iconPath) Storage::disk('public')->delete($iconPath);
                
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create category', $e->getMessage(), 500);
        }
    }
    public function show(int $id): JsonResponse
    {
        try {
            $category = Category::with([
                'products' => function ($query) {
                    $query->active()->limit(10)->select('id', 'name', 'sku', 'price', 'category_id');
                }
            ])->findOrFail($id);

            // 追加メトリクスを付加
            $category->total_products = $category->products_count;
            $category->active_products = $category->activeProducts()->count();

            return $this->successResponse('Category retrieved successfully', [
                'category' => $category
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Category not found', $e->getMessage(), 404);
        }
    }
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $category = Category::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'slug' => 'sometimes|string|max:255|unique:categories,slug,' . $id,
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'icon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:1024',
                'sort_order' => 'nullable|integer|min:0',
                'is_active' => 'boolean',
                'is_featured' => 'boolean',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'custom_attributes' => 'nullable|json',
                'remove_image' => 'boolean',
                'remove_icon' => 'boolean',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            DB::beginTransaction();

            try {
                $updateData = $request->except(['image', 'icon', 'remove_image', 'remove_icon']);
                
                // スラグの更新を処理
                if ($request->has('slug') && $request->slug !== $category->slug) {
                    $slug = $request->slug;
                    $originalSlug = $slug;
                    $counter = 1;
                    while (Category::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                        $slug = $originalSlug . '-' . $counter;
                        $counter++;
                    }
                    $updateData['slug'] = $slug;
                }

                // 画像の削除/更新を処理
                if ($request->boolean('remove_image') && $category->image) {
                    Storage::disk('public')->delete($category->image);
                    $updateData['image'] = null;
                } elseif ($request->hasFile('image')) {
                    // 古い画像を削除
                    if ($category->image) {
                        Storage::disk('public')->delete($category->image);
                    }
                    
                    // 新しい画像をアップロード
                    $image = $request->file('image');
                    $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                    $updateData['image'] = $image->storeAs('categories/images', $filename, 'public');
                }

                // アイコンの削除/更新を処理
                if ($request->boolean('remove_icon') && $category->icon) {
                    Storage::disk('public')->delete($category->icon);
                    $updateData['icon'] = null;
                } elseif ($request->hasFile('icon')) {
                    // 古いアイコンを削除
                    if ($category->icon) {
                        Storage::disk('public')->delete($category->icon);
                    }
                    
                    // 新しいアイコンをアップロード
                    $icon = $request->file('icon');
                    $filename = time() . '_' . Str::random(10) . '.' . $icon->getClientOriginalExtension();
                    $updateData['icon'] = $icon->storeAs('categories/icons', $filename, 'public');
                }

                $category->update($updateData);

                DB::commit();

                return $this->successResponse('Category updated successfully', [
                    'category' => $category
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update category', $e->getMessage(), 500);
        }
    }
    public function destroy(int $id): JsonResponse
    {
        try {
            $category = Category::findOrFail($id);

            // カテゴリが削除可能か確認
            if (!$category->canBeDeleted()) {
                return $this->errorResponse('Cannot delete category with products', null, 400);
            }

            DB::beginTransaction();

            try {
                // カテゴリ画像を削除
                if ($category->image) {
                    Storage::disk('public')->delete($category->image);
                }
                
                if ($category->icon) {
                    Storage::disk('public')->delete($category->icon);
                }

                $category->delete();

                DB::commit();

                return $this->successResponse('Category deleted successfully');

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete category', $e->getMessage(), 500);
        }
    }
    public function updateSortOrder(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'categories' => 'required|array|min:1',
                'categories.*.id' => 'required|exists:categories,id',
                'categories.*.sort_order' => 'required|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            DB::beginTransaction();

            try {
                $success = Category::updateSortOrders($request->categories);

                if (!$success) {
                    throw new \Exception('Failed to update sort orders');
                }

                DB::commit();

                return $this->successResponse('Sort order updated successfully');

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update sort order', $e->getMessage(), 500);
        }
    }
    public function toggleStatus(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->update(['is_active' => !$category->is_active]);

        return $this->successResponse('Category status updated successfully', [
            'category' => $category->only(['id', 'name', 'is_active'])
        ]);
    }
    public function analytics(int $id): JsonResponse
    {
        try {
            $category = Category::findOrFail($id);

            $analytics = [
                'total_products' => $category->products_count,
                'active_products' => $category->activeProducts()->count(),
            ];

            // カテゴリの売上を取得（このカテゴリの全商品売上合計）
            $revenue = $category->products()
                ->join('order_items', 'products.id', '=', 'order_items.product_id')
                ->sum('order_items.total');

            $analytics['total_revenue'] = $revenue;

            // このカテゴリの売上上位商品を取得
            $topProducts = $category->products()
                ->join('order_items', 'products.id', '=', 'order_items.product_id')
                ->select('products.id', 'products.name', 'products.sku', DB::raw('SUM(order_items.quantity) as total_sold'))
                ->groupBy('products.id', 'products.name', 'products.sku')
                ->orderBy('total_sold', 'desc')
                ->limit(5)
                ->get();

            return $this->successResponse('Category analytics retrieved successfully', [
                'category' => $category->only(['id', 'name', 'slug']),
                'analytics' => $analytics,
                'top_products' => $topProducts
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve category analytics', $e->getMessage(), 500);
        }
    }

}