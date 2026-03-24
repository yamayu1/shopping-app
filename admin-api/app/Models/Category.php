<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'image',
        'icon',
        'sort_order',
        'is_active',
        'is_featured',
        'meta_title',
        'meta_description',
        'custom_attributes',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'custom_attributes' => 'array',
    ];

    // リレーション
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    // アクティブな商品
    public function activeProducts()
    {
        return $this->products()->where('is_active', true);
    }

    // 商品数を取得
    public function getProductsCountAttribute(): int
    {
        return $this->products()->count();
    }

    // 階層レベルを取得
    public function getLevelAttribute(): int
    {
        $level = 0;
        $parent = $this->parent;
        while ($parent) {
            $level++;
            $parent = $parent->parent;
        }
        return $level;
    }

    // スコープ
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeRoot(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order', 'asc');
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where('name', 'like', "%{$search}%");
    }

    public function scopeWithChildren(Builder $query): Builder
    {
        return $query->with('children');
    }

    // ツリー構造を取得
    public static function getTree(): array
    {
        $categories = static::with('children')
            ->root()
            ->ordered()
            ->get();

        return $categories->map(function ($category) {
            return static::buildTreeNode($category);
        })->toArray();
    }

    private static function buildTreeNode(Category $category): array
    {
        $node = $category->toArray();
        if ($category->children->isNotEmpty()) {
            $node['children'] = $category->children
                ->sortBy('sort_order')
                ->map(function ($child) {
                    return static::buildTreeNode($child);
                })->values()->toArray();
        }
        return $node;
    }

    // 並び順の一括更新
    public static function updateSortOrders(array $orders): bool
    {
        foreach ($orders as $order) {
            $data = ['sort_order' => $order['sort_order']];
            if (array_key_exists('parent_id', $order)) {
                $data['parent_id'] = $order['parent_id'];
            }
            static::where('id', $order['id'])->update($data);
        }
        return true;
    }

    // 削除可能かチェック
    public function canBeDeleted(): bool
    {
        return $this->products()->count() === 0 && $this->children()->count() === 0;
    }

    // 指定IDが子孫かどうかチェック（循環参照防止）
    public function isAncestorOf(int $categoryId): bool
    {
        $childIds = $this->children()->pluck('id')->toArray();
        if (in_array($categoryId, $childIds)) {
            return true;
        }
        foreach ($this->children as $child) {
            if ($child->isAncestorOf($categoryId)) {
                return true;
            }
        }
        return false;
    }

    // カテゴリを別の親に移動
    public function moveTo(?int $parentId): bool
    {
        if ($parentId !== null) {
            if ($parentId == $this->id || $this->isAncestorOf($parentId)) {
                return false;
            }
        }
        $this->update(['parent_id' => $parentId]);
        return true;
    }

    // フルパスを取得（パンくずリスト用）
    public function getFullPath(): string
    {
        $path = [$this->name];
        $parent = $this->parent;
        while ($parent) {
            array_unshift($path, $parent->name);
            $parent = $parent->parent;
        }
        return implode(' > ', $path);
    }
}
