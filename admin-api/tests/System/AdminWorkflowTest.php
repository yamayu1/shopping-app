<?php

namespace Tests\System;

use Tests\TestCase;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Category;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * 結合テスト: 管理画面の一連のワークフローテスト
 * ログインから商品管理・注文管理までの管理者フロー全体をテスト
 */
class AdminWorkflowTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admin_can_complete_full_product_management_workflow()
    {
        // ステップ1: 管理者ログイン
        $admin = Admin::factory()->create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
        ]);

        $loginResponse = $this->postJson('/api/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertStatus(200)
                      ->assertJsonStructure(['success', 'data' => ['access_token']]);

        $token = $loginResponse->json('data.access_token');
        Sanctum::actingAs($admin, ['*'], 'admin');

        // ステップ2: カテゴリを作成
        $categoryResponse = $this->postJson('/api/admin/categories', [
            'name' => 'Electronics',
            'description' => 'Electronic products',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $categoryResponse->assertStatus(201);
        $categoryId = $categoryResponse->json('data.id');

        // ステップ3: 商品を作成
        $productData = [
            'name' => 'Test Laptop',
            'description' => 'High performance laptop',
            'price' => 1500,
            'stock_quantity' => 10,
            'low_stock_threshold' => 5,
            'category_id' => $categoryId,
            'sku' => 'LAPTOP-001',
            'is_active' => true,
            'is_featured' => true,
        ];

        $createProductResponse = $this->postJson('/api/admin/products', $productData);

        $createProductResponse->assertStatus(201)
                              ->assertJsonPath('success', true);

        $productId = $createProductResponse->json('data.id');

        // ステップ4: 商品一覧を表示
        $listResponse = $this->getJson('/api/admin/products');

        $listResponse->assertStatus(200);
        $this->assertGreaterThan(0, count($listResponse->json('data.data')));

        // ステップ5: 商品を更新
        $updateResponse = $this->putJson("/api/admin/products/{$productId}", [
            'name' => 'Updated Laptop',
            'price' => 1400,
        ]);

        $updateResponse->assertStatus(200)
                       ->assertJsonPath('data.name', 'Updated Laptop')
                       ->assertJsonPath('data.price', 1400);

        // ステップ6: 在庫数を更新
        $stockUpdateResponse = $this->patchJson("/api/admin/products/{$productId}/stock", [
            'stock_quantity' => 15,
        ]);

        $stockUpdateResponse->assertStatus(200);

        $product = Product::find($productId);
        $this->assertEquals(15, $product->stock_quantity);

        // ステップ7: 商品の有効/無効を切り替え
        $toggleResponse = $this->patchJson("/api/admin/products/{$productId}/toggle-active", [
            'is_active' => false,
        ]);

        $toggleResponse->assertStatus(200);
        $this->assertFalse(Product::find($productId)->is_active);

        // ステップ8: 在庫確認（在庫少の商品）
        $inventoryResponse = $this->getJson('/api/admin/inventory?low_stock_only=true');

        $inventoryResponse->assertStatus(200);

        // ステップ9: 統計を表示
        $statsResponse = $this->getJson('/api/admin/inventory/statistics');

        $statsResponse->assertStatus(200)
                      ->assertJsonStructure([
                          'success',
                          'data' => [
                              'total_products',
                              'low_stock_products',
                              'out_of_stock_products',
                              'total_inventory_value',
                          ],
                      ]);

        // ステップ10: 商品を削除
        $deleteResponse = $this->deleteJson("/api/admin/products/{$productId}");

        $deleteResponse->assertStatus(200);
        $this->assertSoftDeleted('products', ['id' => $productId]);
    }

    /** @test */
    public function admin_can_manage_orders_workflow()
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin, ['*'], 'admin');

        // テストデータを作成
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'stock_quantity' => 50,
        ]);
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        // ステップ1: 全注文を表示
        $ordersResponse = $this->getJson('/api/admin/orders');

        $ordersResponse->assertStatus(200)
                       ->assertJsonStructure(['success', 'data' => ['data']]);

        // ステップ2: 注文詳細を表示
        $orderDetailResponse = $this->getJson("/api/admin/orders/{$order->id}");

        $orderDetailResponse->assertStatus(200)
                            ->assertJsonPath('data.id', $order->id);

        // ステップ3: 注文ステータスを更新
        $updateStatusResponse = $this->patchJson("/api/admin/orders/{$order->id}/status", [
            'status' => 'confirmed',
        ]);

        $updateStatusResponse->assertStatus(200);
        $this->assertEquals('confirmed', Order::find($order->id)->status);

        // ステップ4: ステータスで注文を絞り込み
        $filterResponse = $this->getJson('/api/admin/orders?status=confirmed');

        $filterResponse->assertStatus(200);
        $orders = $filterResponse->json('data.data');

        foreach ($orders as $orderItem) {
            $this->assertEquals('confirmed', $orderItem['status']);
        }

        // ステップ5: 注文統計を表示
        $statsResponse = $this->getJson('/api/admin/orders/statistics');

        $statsResponse->assertStatus(200)
                      ->assertJsonStructure([
                          'success',
                          'data' => [
                              'total_orders',
                              'total_revenue',
                          ],
                      ]);
    }

    /** @test */
    public function admin_can_manage_inventory_with_stock_alerts()
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin, ['*'], 'admin');

        $category = Category::factory()->create();

        // 在庫数の異なる商品を作成
        $lowStockProduct = Product::factory()->create([
            'category_id' => $category->id,
            'stock_quantity' => 3,
            'low_stock_threshold' => 10,
        ]);

        $outOfStockProduct = Product::factory()->create([
            'category_id' => $category->id,
            'stock_quantity' => 0,
            'low_stock_threshold' => 10,
        ]);

        $normalProduct = Product::factory()->create([
            'category_id' => $category->id,
            'stock_quantity' => 50,
            'low_stock_threshold' => 10,
        ]);

        // ステップ1: 在庫少アラートを表示
        $lowStockResponse = $this->getJson('/api/admin/inventory/low-stock-alerts');

        $lowStockResponse->assertStatus(200);
        $lowStockItems = $lowStockResponse->json('data');

        $this->assertGreaterThan(0, count($lowStockItems));

        $productIds = array_column($lowStockItems, 'product_id');
        $this->assertContains($lowStockProduct->id, $productIds);

        // ステップ2: 在庫少商品の在庫を更新
        $updateStockResponse = $this->putJson("/api/admin/inventory/product/{$lowStockProduct->id}", [
            'quantity' => 20,
            'type' => 'add',
            'notes' => 'Restock from warehouse',
        ]);

        $updateStockResponse->assertStatus(200);

        $updatedProduct = Product::find($lowStockProduct->id);
        $this->assertEquals(23, $updatedProduct->stock_quantity);

        // ステップ3: 在庫統計を表示
        $statsResponse = $this->getJson('/api/admin/inventory/statistics');

        $statsResponse->assertStatus(200);
        $stats = $statsResponse->json('data');

        $this->assertArrayHasKey('low_stock_products', $stats);
        $this->assertArrayHasKey('out_of_stock_products', $stats);

        // ステップ4: 在庫をCSVにエクスポート
        $exportResponse = $this->get('/api/admin/inventory/export');

        $exportResponse->assertStatus(200);
        $this->assertEquals('text/csv', $exportResponse->headers->get('Content-Type'));
    }

    /** @test */
    public function admin_can_handle_concurrent_stock_updates()
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin, ['*'], 'admin');

        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'stock_quantity' => 10,
        ]);

        // 在庫の同時更新をシミュレーション
        $results = [];

        for ($i = 0; $i < 3; $i++) {
            $response = $this->putJson("/api/admin/inventory/product/{$product->id}", [
                'quantity' => 4,
                'type' => 'subtract',
                'notes' => "Order #{$i}",
            ]);

            $results[] = $response->status();
        }

        // 少なくとも1件は成功し、他は在庫不足で失敗する可能性がある
        $successCount = count(array_filter($results, fn($status) => $status === 200));
        $this->assertGreaterThanOrEqual(1, $successCount);
        $this->assertLessThanOrEqual(2, $successCount);

        // 最終在庫は0以上であること
        $finalProduct = Product::find($product->id);
        $this->assertGreaterThanOrEqual(0, $finalProduct->stock_quantity);
        $this->assertLessThanOrEqual(10, $finalProduct->stock_quantity);
    }

    /** @test */
    public function admin_can_manage_users()
    {
        $admin = Admin::factory()->create();
        Sanctum::actingAs($admin, ['*'], 'admin');

        $user = User::factory()->create(['is_active' => true]);

        // ステップ1: 全ユーザーを表示
        $usersResponse = $this->getJson('/api/admin/users');

        $usersResponse->assertStatus(200)
                      ->assertJsonStructure(['success', 'data' => ['data']]);

        // ステップ2: ユーザー詳細を表示
        $userDetailResponse = $this->getJson("/api/admin/users/{$user->id}");

        $userDetailResponse->assertStatus(200)
                          ->assertJsonPath('data.id', $user->id);

        // ステップ3: ユーザーステータスを更新
        $updateStatusResponse = $this->patchJson("/api/admin/users/{$user->id}/status", [
            'is_active' => false,
        ]);

        $updateStatusResponse->assertStatus(200);
        $this->assertFalse(User::find($user->id)->is_active);

        // ステップ4: ユーザー統計を表示
        $statsResponse = $this->getJson('/api/admin/users/statistics');

        $statsResponse->assertStatus(200)
                      ->assertJsonStructure([
                          'success',
                          'data' => [
                              'total_users',
                              'verified_users',
                          ],
                      ]);
    }
}
