<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Admin::factory()->create(['role' => 'admin']);
        $this->user = User::factory()->create();
    }

    /** @test */
    public function unauthenticated_user_cannot_access_order_endpoints(): void
    {
        $response = $this->getJson('/api/admin/orders');
        $response->assertStatus(401);
    }

    // Index

    /** @test */
    public function it_lists_orders_with_pagination(): void
    {
        Order::factory()->count(5)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->getJson('/api/admin/orders');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'data' => [
                         'orders',
                         'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                     ],
                 ]);
    }

    // Show

    /** @test */
    public function it_shows_a_single_order_by_order_number(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'order_number' => 'ORD-SHOW-001',
        ]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->getJson('/api/admin/orders/ORD-SHOW-001');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.order.order_number', 'ORD-SHOW-001');
    }

    // Update status

    /** @test */
    public function it_updates_order_status_with_valid_transition(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'order_number' => 'ORD-STATUS-001',
        ]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->putJson('/api/admin/orders/ORD-STATUS-001/status', [
                             'status' => Order::STATUS_CONFIRMED,
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $this->assertEquals(Order::STATUS_CONFIRMED, $order->fresh()->status);
    }

    /** @test */
    public function it_rejects_invalid_status_transition(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'order_number' => 'ORD-INVALID',
        ]);

        // pending -> delivered is not valid
        $response = $this->actingAs($this->admin, 'admin')
                         ->putJson('/api/admin/orders/ORD-INVALID/status', [
                             'status' => Order::STATUS_DELIVERED,
                         ]);

        $response->assertStatus(400);
    }
}
