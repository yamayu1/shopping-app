<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::factory()->create();
        $this->category = Category::factory()->create();
    }

    /** @test */
    public function it_can_list_all_products()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        Product::factory()->count(5)->create(['category_id' => $this->category->id]);

        $response = $this->getJson('/api/admin/products');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'data' => [],
                         'pagination',
                     ],
                 ]);
    }

    /** @test */
    public function it_can_create_a_product()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $productData = [
            'name' => 'New Product',
            'description' => 'Product description',
            'price' => 1000,
            'stock_quantity' => 50,
            'category_id' => $this->category->id,
            'sku' => 'SKU-' . uniqid(),
            'is_active' => true,
            'is_featured' => false,
        ];

        $response = $this->postJson('/api/admin/products', $productData);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.name', 'New Product');

        $this->assertDatabaseHas('products', ['name' => 'New Product']);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_product()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $response = $this->postJson('/api/admin/products', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name', 'price', 'category_id', 'sku']);
    }

    /** @test */
    public function it_can_show_a_single_product()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $product = Product::factory()->create(['category_id' => $this->category->id]);

        $response = $this->getJson("/api/admin/products/{$product->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.id', $product->id)
                 ->assertJsonPath('data.name', $product->name);
    }

    /** @test */
    public function it_returns_404_for_non_existent_product()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $response = $this->getJson('/api/admin/products/99999');

        $response->assertStatus(404);
    }

    /** @test */
    public function it_can_update_a_product()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $product = Product::factory()->create(['category_id' => $this->category->id]);

        $updateData = [
            'name' => 'Updated Product Name',
            'price' => 2000,
        ];

        $response = $this->putJson("/api/admin/products/{$product->id}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.name', 'Updated Product Name');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product Name',
            'price' => 2000,
        ]);
    }

    /** @test */
    public function it_can_delete_a_product()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $product = Product::factory()->create(['category_id' => $this->category->id]);

        $response = $this->deleteJson("/api/admin/products/{$product->id}");

        $response->assertStatus(200);

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    /** @test */
    public function it_can_filter_products_by_category()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();

        Product::factory()->count(3)->create(['category_id' => $category1->id]);
        Product::factory()->count(2)->create(['category_id' => $category2->id]);

        $response = $this->getJson("/api/admin/products?category_id={$category1->id}");

        $response->assertStatus(200);
        $data = $response->json('data.data');
        $this->assertCount(3, $data);
    }

    /** @test */
    public function it_can_search_products()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        Product::factory()->create(['name' => 'Amazing Product', 'category_id' => $this->category->id]);
        Product::factory()->create(['name' => 'Different Item', 'category_id' => $this->category->id]);

        $response = $this->getJson('/api/admin/products?search=Amazing');

        $response->assertStatus(200);
        $data = $response->json('data.data');
        $this->assertCount(1, $data);
        $this->assertStringContainsString('Amazing', $data[0]['name']);
    }

    /** @test */
    public function it_can_filter_products_by_stock_status()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        Product::factory()->create(['stock_quantity' => 10, 'category_id' => $this->category->id]);
        Product::factory()->create(['stock_quantity' => 0, 'category_id' => $this->category->id]);

        $response = $this->getJson('/api/admin/products?in_stock=true');

        $response->assertStatus(200);
        $data = $response->json('data.data');

        foreach ($data as $product) {
            $this->assertGreaterThan(0, $product['stock_quantity']);
        }
    }

    /** @test */
    public function it_can_toggle_product_active_status()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $product = Product::factory()->create([
            'is_active' => true,
            'category_id' => $this->category->id,
        ]);

        $response = $this->patchJson("/api/admin/products/{$product->id}/toggle-active", [
            'is_active' => false,
        ]);

        $response->assertStatus(200);
        $this->assertFalse($product->fresh()->is_active);
    }

    /** @test */
    public function it_can_update_product_stock()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        $product = Product::factory()->create([
            'stock_quantity' => 10,
            'category_id' => $this->category->id,
        ]);

        $response = $this->patchJson("/api/admin/products/{$product->id}/stock", [
            'stock_quantity' => 20,
        ]);

        $response->assertStatus(200);
        $this->assertEquals(20, $product->fresh()->stock_quantity);
    }

    /** @test */
    public function unauthorized_users_cannot_access_admin_endpoints()
    {
        $response = $this->getJson('/api/admin/products');

        $response->assertStatus(401);
    }

    /** @test */
    public function it_paginates_products_correctly()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        Product::factory()->count(25)->create(['category_id' => $this->category->id]);

        $response = $this->getJson('/api/admin/products?page=1&per_page=10');

        $response->assertStatus(200)
                 ->assertJsonPath('data.pagination.current_page', 1)
                 ->assertJsonPath('data.pagination.per_page', 10);

        $data = $response->json('data.data');
        $this->assertCount(10, $data);
    }

    /** @test */
    public function it_can_sort_products_by_price()
    {
        Sanctum::actingAs($this->admin, ['*'], 'admin');

        Product::factory()->create(['price' => 1000, 'category_id' => $this->category->id]);
        Product::factory()->create(['price' => 500, 'category_id' => $this->category->id]);
        Product::factory()->create(['price' => 1500, 'category_id' => $this->category->id]);

        $response = $this->getJson('/api/admin/products?sort_by=price&sort_order=asc');

        $response->assertStatus(200);
        $data = $response->json('data.data');

        $this->assertEquals(500, $data[0]['price']);
        $this->assertEquals(1000, $data[1]['price']);
        $this->assertEquals(1500, $data[2]['price']);
    }
}
