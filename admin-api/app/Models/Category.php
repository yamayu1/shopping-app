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

    // スコープ
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
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

    // 並び順の一括更新
    public static function updateSortOrders(array $orders): bool
    {
        foreach ($orders as $order) {
            static::where('id', $order['id'])->update(['sort_order' => $order['sort_order']]);
        }
        return true;
    }

    // 削除可能かチェック
    public function canBeDeleted(): bool
    {
        return $this->products()->count() === 0;
    }
}
