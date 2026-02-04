<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use App\Models\Address;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 10, 5000);
        $tax = round($subtotal * 0.1, 2);
        $shipping = fake()->randomFloat(2, 0, 50);
        $discount = 0;

        return [
            'user_id' => User::factory(),
            'order_number' => 'ORD-' . fake()->unique()->randomNumber(8),
            'status' => Order::STATUS_PENDING,
            'total_amount' => $subtotal + $tax + $shipping - $discount,
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'shipping_amount' => $shipping,
            'discount_amount' => $discount,
            'shipping_address' => [
                'name' => fake()->name(),
                'address' => fake()->address(),
                'city' => fake()->city(),
                'zip' => fake()->postcode(),
            ],
            'billing_address' => [
                'name' => fake()->name(),
                'address' => fake()->address(),
                'city' => fake()->city(),
                'zip' => fake()->postcode(),
            ],
            'payment_method' => fake()->randomElement(['credit_card', 'bank_transfer', 'cash_on_delivery']),
            'payment_status' => 'pending',
            'notes' => null,
            'shipped_at' => null,
            'delivered_at' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Order $order) {
            if (empty($order->address_id)) {
                $userId = $order->user_id;
                $address = Address::factory()->create(['user_id' => $userId]);
                $order->address_id = $address->id;
            }
        });
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_CONFIRMED,
            'payment_status' => 'paid',
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_PROCESSING,
            'payment_status' => 'paid',
        ]);
    }

    public function shipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_SHIPPED,
            'payment_status' => 'paid',
            'shipped_at' => now(),
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_DELIVERED,
            'payment_status' => 'paid',
            'shipped_at' => now()->subDays(3),
            'delivered_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_CANCELLED,
        ]);
    }
}
