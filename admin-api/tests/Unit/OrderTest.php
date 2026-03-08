<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    // == Status constants ==

    /** @test */
    public function it_has_all_status_constants(): void
    {
        $this->assertEquals('pending', Order::STATUS_PENDING);
        $this->assertEquals('confirmed', Order::STATUS_CONFIRMED);
        $this->assertEquals('processing', Order::STATUS_PROCESSING);
        $this->assertEquals('shipped', Order::STATUS_SHIPPED);
        $this->assertEquals('delivered', Order::STATUS_DELIVERED);
        $this->assertEquals('cancelled', Order::STATUS_CANCELLED);
        $this->assertEquals('refunded', Order::STATUS_REFUNDED);
    }

    /** @test */
    public function it_belongs_to_a_user(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $order->user);
        $this->assertEquals($user->id, $order->user->id);
    }

    /** @test */
    public function it_has_many_order_items(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create();

        OrderItem::factory()->count(3)->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
        ]);

        $this->assertCount(3, $order->orderItems);
        $this->assertInstanceOf(OrderItem::class, $order->orderItems->first());
    }

    /** @test */
    public function it_can_create_order_with_different_statuses(): void
    {
        $user = User::factory()->create();

        $pending = Order::factory()->create(['user_id' => $user->id]);
        $confirmed = Order::factory()->confirmed()->create(['user_id' => $user->id]);
        $shipped = Order::factory()->shipped()->create(['user_id' => $user->id]);

        $this->assertEquals('pending', $pending->status);
        $this->assertEquals('confirmed', $confirmed->status);
        $this->assertEquals('shipped', $shipped->status);
    }

    /** @test */
    public function it_stores_order_number(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'order_number' => 'ORD-12345678',
        ]);

        $this->assertDatabaseHas('orders', [
            'order_number' => 'ORD-12345678',
        ]);
    }
}
