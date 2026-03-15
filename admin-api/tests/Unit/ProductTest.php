<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Category;
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

    /** @test */
    public function it_can_create_a_product()
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
    public function it_belongs_to_a_category()
    {
        $product = Product::factory()->create(['category_id' => $this->category->id]);

        $this->assertInstanceOf(Category::class, $product->category);
        $this->assertEquals($this->category->id, $product->category->id);
    }

    /** @test */
    public function it_determines_if_product_is_on_sale()
    {
        $productOnSale = Product::factory()->create([
            'price' => 1000,
            'sale_price' => 800,
        ]);

        $productNotOnSale = Product::factory()->create([
            'price' => 1000,
            'sale_price' => null,
        ]);

        $this->assertTrue($productOnSale->is_on_sale);
        $this->assertFalse($productNotOnSale->is_on_sale);
    }

    /** @test */
    public function it_returns_effective_price()
    {
        $productOnSale = Product::factory()->create([
            'price' => 1000,
            'sale_price' => 800,
        ]);

        $productNotOnSale = Product::factory()->create([
            'price' => 1000,
            'sale_price' => null,
        ]);

        $this->assertEquals(800, $productOnSale->effective_price);
        $this->assertEquals(1000, $productNotOnSale->effective_price);
    }

    /** @test */
    public function it_determines_if_product_is_low_stock()
    {
        $lowStockProduct = Product::factory()->create([
            'stock_quantity' => 5,
            'low_stock_threshold' => 10,
        ]);

        $inStockProduct = Product::factory()->create([
            'stock_quantity' => 50,
            'low_stock_threshold' => 10,
        ]);

        $this->assertTrue($lowStockProduct->is_low_stock);
        $this->assertFalse($inStockProduct->is_low_stock);
    }

    /** @test */
    public function it_returns_correct_stock_status()
    {
        $outOfStock = Product::factory()->create(['stock_quantity' => 0]);
        $lowStock = Product::factory()->create([
            'stock_quantity' => 5,
            'low_stock_threshold' => 10,
        ]);
        $inStock = Product::factory()->create([
            'stock_quantity' => 50,
            'low_stock_threshold' => 10,
        ]);

        $this->assertEquals('out_of_stock', $outOfStock->stock_status);
        $this->assertEquals('low_stock', $lowStock->stock_status);
        $this->assertEquals('in_stock', $inStock->stock_status);
    }

    /** @test */
    public function it_can_update_stock_by_adding()
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $result = $product->updateStock(5, 'add', 'Restock');

        $this->assertTrue($result);
        $this->assertEquals(15, $product->fresh()->stock_quantity);
    }

    /** @test */
    public function it_can_update_stock_by_subtracting()
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $result = $product->updateStock(3, 'subtract', 'Sale');

        $this->assertTrue($result);
        $this->assertEquals(7, $product->fresh()->stock_quantity);
    }

    /** @test */
    public function it_cannot_subtract_more_than_available_stock()
    {
        $product = Product::factory()->create(['stock_quantity' => 5]);

        $result = $product->updateStock(10, 'subtract', 'Sale');

        $this->assertFalse($result);
        $this->assertEquals(5, $product->fresh()->stock_quantity);
    }

    /** @test */
    public function it_can_reserve_stock()
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $result = $product->reserveStock(5);

        $this->assertTrue($result);
        $this->assertEquals(5, $product->fresh()->stock_quantity);
    }

    /** @test */
    public function it_can_release_stock()
    {
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $result = $product->releaseStock(5);

        $this->assertTrue($result);
        $this->assertEquals(15, $product->fresh()->stock_quantity);
    }

    /** @test */
    public function it_calculates_profit_margin_correctly()
    {
        $product = Product::factory()->create([
            'price' => 1000,
            'sale_price' => null,
            'cost_price' => 600,
        ]);

        $expectedMargin = ((1000 - 600) / 600) * 100;
        $this->assertEquals($expectedMargin, $product->getProfitMargin());
    }

    /** @test */
    public function it_returns_zero_margin_without_cost_price()
    {
        $product = Product::factory()->create([
            'price' => 1000,
            'cost_price' => null,
        ]);

        $this->assertEquals(0, $product->getProfitMargin());
    }

    /** @test */
    public function it_scopes_active_products()
    {
        Product::factory()->create(['is_active' => true]);
        Product::factory()->create(['is_active' => false]);

        $activeProducts = Product::active()->get();

        $this->assertCount(1, $activeProducts);
        $this->assertTrue($activeProducts->first()->is_active);
    }

    /** @test */
    public function it_scopes_featured_products()
    {
        Product::factory()->create(['is_featured' => true]);
        Product::factory()->create(['is_featured' => false]);

        $featuredProducts = Product::featured()->get();

        $this->assertCount(1, $featuredProducts);
        $this->assertTrue($featuredProducts->first()->is_featured);
    }

    /** @test */
    public function it_scopes_products_on_sale()
    {
        Product::factory()->create(['price' => 1000, 'sale_price' => 800]);
        Product::factory()->create(['price' => 1000, 'sale_price' => null]);

        $onSaleProducts = Product::onSale()->get();

        $this->assertCount(1, $onSaleProducts);
    }

    /** @test */
    public function it_scopes_products_in_stock()
    {
        Product::factory()->create(['stock_quantity' => 10]);
        Product::factory()->create(['stock_quantity' => 0]);

        $inStockProducts = Product::inStock()->get();

        $this->assertCount(1, $inStockProducts);
        $this->assertGreaterThan(0, $inStockProducts->first()->stock_quantity);
    }

    /** @test */
    public function it_scopes_low_stock_products()
    {
        Product::factory()->create(['stock_quantity' => 5, 'low_stock_threshold' => 10]);
        Product::factory()->create(['stock_quantity' => 50, 'low_stock_threshold' => 10]);

        $lowStockProducts = Product::lowStock()->get();

        $this->assertCount(1, $lowStockProducts);
    }

    /** @test */
    public function it_scopes_products_by_category()
    {
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();

        Product::factory()->create(['category_id' => $category1->id]);
        Product::factory()->create(['category_id' => $category2->id]);

        $products = Product::byCategory($category1->id)->get();

        $this->assertCount(1, $products);
        $this->assertEquals($category1->id, $products->first()->category_id);
    }

    /** @test */
    public function it_scopes_products_by_search()
    {
        Product::factory()->create(['name' => 'Amazing Product']);
        Product::factory()->create(['name' => 'Different Item']);

        $products = Product::search('Amazing')->get();

        $this->assertCount(1, $products);
        $this->assertStringContainsString('Amazing', $products->first()->name);
    }

    /** @test */
    public function it_scopes_products_by_price_range()
    {
        Product::factory()->create(['price' => 500]);
        Product::factory()->create(['price' => 1500]);
        Product::factory()->create(['price' => 2500]);

        $products = Product::priceRange(1000, 2000)->get();

        $this->assertCount(1, $products);
        $this->assertEquals(1500, $products->first()->price);
    }
}
