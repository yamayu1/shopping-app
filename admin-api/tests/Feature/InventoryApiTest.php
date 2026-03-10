<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InventoryApiTest extends TestCase
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
    public function it_lists_inventory_with_metrics(): void
    {
        Product::factory()->count(5)->create(['category_id' => $this->category->id]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->getJson('/api/admin/inventory');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'data' => [
                         'products',
                         'pagination',
                         'metrics',
                     ],
                 ]);
    }

    // == Update stock ==

    /** @test */
    public function it_adds_stock(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'stock_quantity' => 10,
        ]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->putJson("/api/admin/inventory/products/{$product->id}/stock", [
                             'operation' => 'add',
                             'quantity' => 20,
                             'reason' => 'Restock from supplier',
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.new_quantity', 30);

        $this->assertEquals(30, $product->fresh()->stock_quantity);
    }

    /** @test */
    public function it_subtracts_stock(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'stock_quantity' => 20,
        ]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->putJson("/api/admin/inventory/products/{$product->id}/stock", [
                             'operation' => 'subtract',
                             'quantity' => 5,
                             'reason' => 'Damaged goods',
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.new_quantity', 15);

        $this->assertEquals(15, $product->fresh()->stock_quantity);
    }

    /** @test */
    public function it_validates_stock_update_fields(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);

        $response = $this->actingAs($this->admin, 'admin')
                         ->putJson("/api/admin/inventory/products/{$product->id}/stock", []);

        $response->assertStatus(422);
    }
}
