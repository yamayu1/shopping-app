<?php

namespace Database\Factories;

use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryLogFactory extends Factory
{
    protected $model = InventoryLog::class;

    public function definition(): array
    {
        $quantityChange = fake()->numberBetween(-50, 100);

        return [
            'product_id' => Product::factory(),
            'admin_id' => Admin::factory(),
            'quantity_change' => $quantityChange,
            'quantity_after' => fake()->numberBetween(0, 200),
            'reason' => fake()->randomElement(['Restock', 'Sale', 'Manual adjustment', 'Return', 'Damage']),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
