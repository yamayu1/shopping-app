<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'short_description',
        'sku',
        'price',
        'sale_price',
        'cost_price',
        'stock_quantity',
        'low_stock_threshold',
        'category_id',
        'brand',
        'weight',
        'dimensions',
        'color',
        'size',
        'material',
        'is_active',
        'is_featured',
        'tags',
        'images',
        'attributes',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'images' => 'json',
        'attributes' => 'json',
        'tags' => 'json',
    ];

    // リレーション
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function inventoryLogs()
    {
        return $this->hasMany(InventoryLog::class);
    }

    // 在庫状況を取得
    public function getStockStatusAttribute(): string
    {
        if ($this->stock_quantity <= 0) {
            return 'out_of_stock';
        } elseif ($this->stock_quantity <= ($this->low_stock_threshold ?? 5)) {
            return 'low_stock';
        }
        return 'in_stock';
    }

    // セール中かどうか
    public function getIsOnSaleAttribute(): bool
    {
        return $this->sale_price && $this->sale_price < $this->price;
    }

    // 実質価格（セール価格があればそちら）
    public function getEffectivePriceAttribute(): float
    {
        return $this->is_on_sale ? $this->sale_price : $this->price;
    }

    // 在庫が少ないかどうか
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock_quantity <= ($this->low_stock_threshold ?? 5);
    }

    // スコープ
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock(Builder $query): Builder
    {
        return $query->where('stock_quantity', '>', 0);
    }

    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('sku', 'like', "%{$search}%");
        });
    }

    // 在庫が少ない商品
    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                     ->where('stock_quantity', '>', 0);
    }

    // 注目商品のみ
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    // 価格範囲でフィルター
    public function scopePriceRange(Builder $query, $min, $max): Builder
    {
        return $query->whereBetween('price', [$min, $max]);
    }

    // 総販売数を取得
    public function getTotalSales(): int
    {
        return $this->orderItems()->sum('quantity');
    }

    // 総売上を取得
    public function getTotalRevenue(): float
    {
        return (float) $this->orderItems()->sum('total');
    }

    // 利益率を取得
    public function getProfitMargin(): float
    {
        if (!$this->cost_price || $this->price <= 0) {
            return 0;
        }
        return round((($this->price - $this->cost_price) / $this->price) * 100, 2);
    }

    // 在庫を更新（同時アクセス対策あり）
    public function updateStock(int $quantity, string $operation = 'subtract', string $reason = ''): bool
    {
        if ($operation === 'subtract' && $this->stock_quantity < $quantity) {
            return false;
        }

        $newQuantity = $operation === 'add'
            ? $this->stock_quantity + $quantity
            : $this->stock_quantity - $quantity;

        // 楽観的ロック：現在の在庫数が変わっていないことを確認してから更新
        $updated = $this->where('id', $this->id)
                       ->where('stock_quantity', $this->stock_quantity)
                       ->update(['stock_quantity' => $newQuantity]);

        if ($updated) {
            // 在庫変更ログを記録
            $this->inventoryLogs()->create([
                'quantity_change' => $operation === 'add' ? $quantity : -$quantity,
                'quantity_after' => $newQuantity,
                'reason' => $reason,
                'admin_id' => auth('admin')->id(),
            ]);
            $this->refresh();
            return true;
        }

        return false;
    }
}
