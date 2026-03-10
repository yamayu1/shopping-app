<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::factory()->create(['role' => 'admin']);
        $this->category = Category::factory()->create();
    }

    /** @test */
    public function unauthenticated_user_cannot_access_product_endpoints(): void
    {
        $response = $this->getJson('/api/admin/products');
        $response->assertStatus(401);
    }

    // Index

    /** @test */
    public function it_lists_products_with_pagination(): void
    {
        Product::factory()->count(20)->create(['category_id' => $this->category->id]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->getJson('/api/admin/products?per_page=10');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'data' => [
                         'products',
                         'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                     ],
                 ]);

        $this->assertEquals(10, count($response->json('data.products')));
        $this->assertEquals(20, $response->json('data.pagination.total'));
    }

    // Store

    /** @test */
    public function it_creates_a_product(): void
    {
        $data = [
            'name' => 'New Product',
            'description' => 'A great product',
            'sku' => 'SKU-NEW-001',
            'price' => 2999.99,
            'stock_quantity' => 100,
            'category_id' => $this->category->id,
            'is_active' => true,
        ];

        $response = $this->actingAs($this->admin, 'admin')
                         ->postJson('/api/admin/products', $data);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertDatabaseHas('products', [
            'name' => 'New Product',
            'sku' => 'SKU-NEW-001',
        ]);
    }

    // Update

    /** @test */
    public function it_updates_a_product(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->putJson("/api/admin/products/{$product->id}", [
                             'name' => 'Updated Name',
                             'price' => 5000,
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $this->assertEquals('Updated Name', $product->fresh()->name);
    }

    /** @test */
    public function it_deletes_a_product_without_orders(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->deleteJson("/api/admin/products/{$product->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }

    /** @test */
    public function it_cannot_delete_product_with_existing_orders(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
        ]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->deleteJson("/api/admin/products/{$product->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }
}
