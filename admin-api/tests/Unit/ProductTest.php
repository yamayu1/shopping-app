<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Category;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->category = Category::factory()->create();
    }

    // Creation

    /** @test */
    public function it_can_create_a_product(): void
    {
        $product = Product::factory()->create([
            'name' => 'Test Product',
            'price' => 1000,
            'category_id' => $this->category->id,
        ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'price' => 1000,
        ]);
    }

    /** @test */
    public function it_belongs_to_a_category(): void
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);

        $this->assertInstanceOf(Category::class, $product->category);
        $this->assertEquals($this->category->id, $product->category->id);
    }

    // stock_status

    /** @test */
    public function it_returns_out_of_stock_when_quantity_is_zero(): void
    {
        $product = Product::factory()->create(['stock_quantity' => 0]);
        $this->assertEquals('out_of_stock', $product->stock_status);
    }

    /** @test */
    public function it_returns_in_stock_when_quantity_above_threshold(): void
    {
        $product = Product::factory()->create([
            'stock_quantity' => 50,
            'low_stock_threshold' => 10,
        ]);
        $this->assertEquals('in_stock', $product->stock_status);
    }

    /** @test */
    public function it_is_on_sale_when_sale_price_is_less_than_price(): void
    {
        $product = Product::factory()->create([
            'price' => 1000,
            'sale_price' => 800,
        ]);
        $this->assertTrue($product->is_on_sale);
    }

    /** @test */
    public function it_is_not_on_sale_when_sale_price_is_null(): void
    {
        $product = Product::factory()->create([
            'price' => 1000,
            'sale_price' => null,
        ]);
        $this->assertFalse($product->is_on_sale);
    }

    // Scopes

    /** @test */
    public function scope_active_returns_only_active_products(): void
    {
        Product::factory()->create(['is_active' => true]);
        Product::factory()->create(['is_active' => false]);

        $active = Product::active()->get();
        $this->assertCount(1, $active);
        $this->assertTrue($active->first()->is_active);
    }

    /** @test */
    public function it_can_add_stock(): void
    {
        $admin = Admin::factory()->create();
        $this->actingAs($admin, 'admin');

        $product = Product::factory()->create(['stock_quantity' => 10]);

        $result = $product->updateStock(5, 'add', 'Restock');

        $this->assertTrue($result);
        $this->assertEquals(15, $product->fresh()->stock_quantity);
    }
}
