import { test, expect } from '@playwright/test';

// ユーザーの購入フローテスト
test.describe('ユーザー購入フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('会員登録から購入までの一連のフロー', async ({ page }) => {
    // 会員登録
    await page.click('text=会員登録');
    await page.waitForURL('**/register');

    await page.fill('input[name="first_name"]', 'テスト');
    await page.fill('input[name="last_name"]', '太郎');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', '090-1234-5678');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="password_confirmation"]', 'Password123!');
    await page.click('button[type="submit"]');

    // ホームに戻る
    await page.waitForURL('**/');

    // 商品一覧へ
    await page.click('text=商品一覧');
    await page.waitForURL('**/products');

    // 商品をクリック
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForURL('**/products/*');

    // カートに追加
    await page.click('button:has-text("カートに追加")');

    // カートへ
    await page.click('[aria-label="カート"]');
    await page.waitForURL('**/cart');

    // 購入手続きへ
    await page.click('button:has-text("購入手続きへ")');
    await page.waitForURL('**/checkout');

    // 住所入力
    await page.fill('input[name="address_line_1"]', '東京都渋谷区1-2-3');
    await page.fill('input[name="city"]', '渋谷区');
    await page.fill('input[name="state"]', '東京都');
    await page.fill('input[name="postal_code"]', '150-0001');

    // 注文確定
    await page.click('button:has-text("注文を確定")');
    await expect(page.locator('text=ご注文ありがとうございます')).toBeVisible();
  });

  test('在庫切れ商品はカートに追加できない', async ({ page }) => {
    await page.goto('/products');

    const outOfStockProduct = page.locator('[data-testid="product-card"]').filter({
      hasText: '在庫切れ',
    }).first();

    if (await outOfStockProduct.count() > 0) {
      await outOfStockProduct.click();
      const addButton = page.locator('button:has-text("カートに追加")');
      await expect(addButton).toBeDisabled();
    }
  });

  test('商品を検索できる', async ({ page }) => {
    await page.goto('/products');
    await page.fill('input[placeholder*="検索"]', 'ラップトップ');
    await page.press('input[placeholder*="検索"]', 'Enter');
    // 検索結果が表示されること
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  });
});
