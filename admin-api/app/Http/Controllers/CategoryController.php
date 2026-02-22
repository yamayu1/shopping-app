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
    /**
     * CategoryControllerの新しいインスタンスを作成
     */
    public function __construct()
    {
        $this->middleware('auth:admin');
        $this->middleware('check.permission:manage_products');
    }

    /**
     * カテゴリ一覧を表示
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Category::with('parent:id,name,slug');

            // フィルターを適用
            if ($request->has('parent_id')) {
                if ($request->parent_id === 'null' || $request->parent_id === null) {
                    $query->root();
                } else {
                    $query->where('parent_id', $request->parent_id);
                }
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

            if ($request->has('search')) {
                $query->search($request->search);
            }

            // リクエストに応じて子カテゴリを含める
            if ($request->boolean('include_children')) {
                $query->withChildren();
            }

            // ソートを適用
            if ($request->boolean('tree_view')) {
                $categories = $query->root()->ordered()->get();
                $tree = Category::getTree();
                
                return $this->successResponse('Categories tree retrieved successfully', [
                    'categories' => $tree
                ]);
            } else {
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
            }

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to retrieve categories', $e->getMessage(), 500);
        }
    }

    /**
     * 新しいカテゴリを登録
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|unique:categories,slug',
                'description' => 'nullable|string',
                'parent_id' => 'nullable|exists:categories,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'icon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:1024',
                'sort_order' => 'nullable|integer|min:0',
                'is_active' => 'boolean',
                'is_featured' => 'boolean',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'attributes' => 'nullable|json',
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
                    $maxSort = Category::where('parent_id', $request->parent_id)->max('sort_order') ?? 0;
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

                $category->load('parent:id,name,slug');

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

    /**
     * 指定されたカテゴリを表示
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $category = Category::with([
                'parent:id,name,slug',
                'children:id,name,slug,parent_id,sort_order,is_active',
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

    /**
     * 指定されたカテゴリを更新
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $category = Category::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'slug' => 'sometimes|string|max:255|unique:categories,slug,' . $id,
                'description' => 'nullable|string',
                'parent_id' => 'nullable|exists:categories,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'icon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:1024',
                'sort_order' => 'nullable|integer|min:0',
                'is_active' => 'boolean',
                'is_featured' => 'boolean',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'attributes' => 'nullable|json',
                'remove_image' => 'boolean',
                'remove_icon' => 'boolean',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            // 自分自身を親に設定することを防止
            if ($request->has('parent_id') && $request->parent_id == $id) {
                return $this->errorResponse('Category cannot be its own parent', null, 400);
            }

            // 循環参照を防止
            if ($request->has('parent_id') && $request->parent_id) {
                if ($category->isAncestorOf($request->parent_id)) {
                    return $this->errorResponse('Cannot move category to its descendant', null, 400);
                }
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

                $category->load('parent:id,name,slug');

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

    /**
     * 指定されたカテゴリを削除
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $category = Category::findOrFail($id);

            // カテゴリが削除可能か確認
            if (!$category->canBeDeleted()) {
                return $this->errorResponse('Cannot delete category with products or subcategories', null, 400);
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

    /**
     * カテゴリの並び順を更新
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateSortOrder(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'categories' => 'required|array|min:1',
                'categories.*.id' => 'required|exists:categories,id',
                'categories.*.sort_order' => 'required|integer|min:0',
                'categories.*.parent_id' => 'nullable|exists:categories,id',
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

    /**
     * カテゴリステータスを切り替え（有効/無効）
     *
     * @param int $id
     * @return JsonResponse
     */
    public function toggleStatus(int $id): JsonResponse
    {
        try {
            $category = Category::findOrFail($id);
            $category->update(['is_active' => !$category->is_active]);

            return $this->successResponse('Category status updated successfully', [
                'category' => $category->only(['id', 'name', 'is_active'])
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update category status', $e->getMessage(), 500);
        }
    }

    /**
     * カテゴリを別の親に移動
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function move(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'parent_id' => 'nullable|exists:categories,id',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Validation failed', $validator->errors(), 422);
            }

            $category = Category::findOrFail($id);

            if (!$category->moveTo($request->parent_id)) {
                return $this->errorResponse('Cannot move category to specified parent', null, 400);
            }

            $category->load('parent:id,name,slug');

            return $this->successResponse('Category moved successfully', [
                'category' => $category
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to move category', $e->getMessage(), 500);
        }
    }

    /**
     * カテゴリ分析データを取得
     *
     * @param int $id
     * @return JsonResponse
     */
    public function analytics(int $id): JsonResponse
    {
        try {
            $category = Category::findOrFail($id);

            $analytics = [
                'total_products' => $category->products_count,
                'active_products' => $category->activeProducts()->count(),
                'total_subcategories' => $category->children()->count(),
                'active_subcategories' => $category->children()->active()->count(),
                'level' => $category->level,
                'full_path' => $category->getFullPath(),
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

    /**
     * 成功レスポンスを返す
     */
    private function successResponse(string $message, $data = null, int $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * エラーレスポンスを返す
     */
    private function errorResponse(string $message, $errors = null, int $statusCode = 400): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }
}