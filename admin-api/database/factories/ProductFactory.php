<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'short_description' => fake()->sentence(),
            'sku' => 'SKU-' . fake()->unique()->randomNumber(8),
            'price' => fake()->randomFloat(2, 10, 10000),
            'sale_price' => null,
            'cost_price' => null,
            'stock_quantity' => fake()->numberBetween(0, 200),
            'low_stock_threshold' => 10,
            'category_id' => Category::factory(),
            'brand' => fake()->company(),
            'color' => fake()->safeColorName(),
            'size' => fake()->randomElement(['S', 'M', 'L', 'XL', null]),
            'material' => fake()->randomElement(['Cotton', 'Polyester', 'Leather', null]),
            'is_active' => true,
            'is_featured' => false,
            'tags' => null,
            'images' => null,
            'custom_attributes' => null,
        ];
    }

    public function onSale(): static
    {
        return $this->state(function (array $attributes) {
            $price = $attributes['price'] ?? 1000;
            return [
                'sale_price' => round($price * 0.8, 2),
            ];
        });
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }

    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 3,
            'low_stock_threshold' => 10,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
