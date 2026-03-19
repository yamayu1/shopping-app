import { test, expect } from '@playwright/test';

// 管理者ワークフローテスト
test.describe('管理者ワークフロー', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者でログイン
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');
  });

  test('商品の登録・編集・削除ができる', async ({ page }) => {
    await page.click('text=商品管理');
    await page.waitForURL('**/admin/products');

    // 新規商品追加
    await page.click('button:has-text("新規商品追加")');
    await page.fill('input[name="name"]', `テスト商品 ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'テスト商品の説明');
    await page.fill('input[name="price"]', '1000');
    await page.fill('input[name="stock_quantity"]', '50');
    await page.fill('input[name="sku"]', `SKU-${Date.now()}`);
    await page.click('button:has-text("追加")');
    await expect(page.locator('text=商品を追加しました')).toBeVisible();
  });

  test('在庫を更新できる', async ({ page }) => {
    await page.click('text=在庫管理');
    await page.waitForURL('**/admin/inventory');
    await expect(page.locator('text=総商品数')).toBeVisible();
  });

  test('注文一覧を確認できる', async ({ page }) => {
    await page.click('text=注文管理');
    await page.waitForURL('**/admin/orders');
    await expect(page.locator('text=注文番号')).toBeVisible();
  });

  test('ログインしていない場合は管理画面にアクセスできない', async ({ page }) => {
    // ログアウト
    await page.click('button[aria-label="ログアウト"]');
    await page.goto('/admin');
    await page.waitForURL('**/admin/login');
  });
});
