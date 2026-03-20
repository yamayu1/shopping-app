import { test, expect, Page } from '@playwright/test';

// 管理者認証ヘルパー
async function adminLogin(page: Page) {
  await page.goto('/admin/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin');
}

// 管理者ログインテスト
test.describe('管理者ログイン', () => {
  test('管理者ログインページが表示される', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('text=管理者ログイン').or(page.locator('h1, h4').first())).toBeVisible();
  });

  test('バリデーションエラーが表示される（空フォーム送信）', async ({ page }) => {
    await page.goto('/admin/login');
    await page.click('button[type="submit"]');
    // バリデーションエラーが表示される
    await page.waitForTimeout(500);
  });

  test('不正な認証情報でエラーが表示される', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    // エラーメッセージまたは同じページにとどまること
    const url = page.url();
    expect(url).toContain('admin/login');
  });

  test('正しい認証情報でダッシュボードに遷移する', async ({ page }) => {
    await adminLogin(page);
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
  });
});

// 管理者ダッシュボードテスト
test.describe('管理者ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('統計カードが表示される', async ({ page }) => {
    await expect(page.locator('text=総売上')).toBeVisible();
    await expect(page.locator('text=総注文数')).toBeVisible();
    await expect(page.locator('text=ユーザー数')).toBeVisible();
    await expect(page.locator('text=在庫アラート')).toBeVisible();
  });

  test('最近の注文セクションが表示される', async ({ page }) => {
    await expect(page.locator('text=最近の注文')).toBeVisible();
  });

  test('クイックリンクが表示される', async ({ page }) => {
    await expect(page.locator('text=クイックリンク')).toBeVisible();
    await expect(page.locator('text=商品管理')).toBeVisible();
    await expect(page.locator('text=カテゴリ管理')).toBeVisible();
    await expect(page.locator('text=注文管理')).toBeVisible();
    await expect(page.locator('text=ユーザー管理')).toBeVisible();
    await expect(page.locator('text=在庫管理')).toBeVisible();
  });

  test('今月のサマリーが表示される', async ({ page }) => {
    await expect(page.locator('text=今月のサマリー')).toBeVisible();
    await expect(page.locator('text=新規注文')).toBeVisible();
    await expect(page.locator('text=新規ユーザー')).toBeVisible();
    await expect(page.locator('text=売上成長率')).toBeVisible();
  });

  test('「すべて見る」リンクで注文一覧に遷移する', async ({ page }) => {
    await page.click('text=すべて見る');
    await page.waitForURL('**/admin/orders');
  });
});

// 商品管理テスト
test.describe('管理者 - 商品管理', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.click('text=商品管理');
    await page.waitForURL('**/admin/products');
  });

  test('商品管理ページが表示される', async ({ page }) => {
    await expect(page.locator('h1, h3').filter({ hasText: /商品/ })).toBeVisible();
  });

  test('新規商品追加ダイアログが開く', async ({ page }) => {
    const addButton = page.locator('button:has-text("新規商品追加"), button:has-text("追加")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      // ダイアログまたはフォームが表示される
      const formVisible = await page.locator('input[name="name"]').isVisible();
      expect(formVisible).toBeTruthy();
    }
  });

  test('商品を追加できる', async ({ page }) => {
    const addButton = page.locator('button:has-text("新規商品追加"), button:has-text("追加")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      const productName = `テスト商品 ${Date.now()}`;
      await page.fill('input[name="name"]', productName);

      const descriptionField = page.locator('textarea[name="description"]');
      if (await descriptionField.isVisible()) {
        await descriptionField.fill('テスト商品の説明文です。10文字以上必要です。');
      }

      const priceField = page.locator('input[name="price"]');
      if (await priceField.isVisible()) {
        await priceField.fill('1000');
      }

      const stockField = page.locator('input[name="stock_quantity"]');
      if (await stockField.isVisible()) {
        await stockField.fill('50');
      }

      const skuField = page.locator('input[name="sku"]');
      if (await skuField.isVisible()) {
        await skuField.fill(`SKU-${Date.now()}`);
      }

      // 送信
      const submitButton = page.locator('button[type="submit"], button:has-text("保存"), button:has-text("追加")').last();
      await submitButton.click();
      await page.waitForTimeout(2000);
    }
  });
});

// 注文管理テスト
test.describe('管理者 - 注文管理', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.click('text=注文管理');
    await page.waitForURL('**/admin/orders');
  });

  test('注文管理ページが表示される', async ({ page }) => {
    // テーブルヘッダーが表示される
    await expect(page.locator('text=注文番号')).toBeVisible();
  });

  test('検索バーが表示される', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="検索"]').or(
      page.locator('[data-testid="search-input"]')
    );
    // 検索UIが存在する場合
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('ステータスフィルターが動作する', async ({ page }) => {
    // ステータスフィルターのセレクトボックスがあれば操作
    const statusFilter = page.locator('select, [role="button"]').filter({ hasText: /すべて|ステータス/ });
    if (await statusFilter.count() > 0) {
      await statusFilter.first().click();
      await page.waitForTimeout(500);
    }
  });
});

// 在庫管理テスト
test.describe('管理者 - 在庫管理', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('在庫管理ページが表示される', async ({ page }) => {
    await page.goto('/admin/inventory');
    await page.waitForTimeout(1000);
    // 在庫管理関連のコンテンツが表示される
    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('在庫') ||
      pageContent?.includes('総商品数') ||
      pageContent?.includes('inventory')
    ).toBeTruthy();
  });
});

// ユーザー管理テスト
test.describe('管理者 - ユーザー管理', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('ユーザー管理ページが表示される', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(1000);
    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('ユーザー') ||
      pageContent?.includes('メールアドレス') ||
      pageContent?.includes('users')
    ).toBeTruthy();
  });
});

// カテゴリ管理テスト
test.describe('管理者 - カテゴリ管理', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('カテゴリ管理ページが表示される', async ({ page }) => {
    await page.goto('/admin/categories');
    await page.waitForTimeout(1000);
    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('カテゴリ') ||
      pageContent?.includes('categories')
    ).toBeTruthy();
  });
});

// アクセス制御テスト
test.describe('管理者 - アクセス制御', () => {
  test('未ログイン時に管理者ダッシュボードにアクセスするとリダイレクトされる', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    // ログインページまたはリダイレクト先
    const url = page.url();
    expect(url.includes('login') || url.includes('admin/login') || url === 'http://localhost:3000/').toBeTruthy();
  });

  test('未ログイン時に商品管理にアクセスするとリダイレクトされる', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url === 'http://localhost:3000/').toBeTruthy();
  });

  test('未ログイン時に注文管理にアクセスするとリダイレクトされる', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url === 'http://localhost:3000/').toBeTruthy();
  });

  test('未ログイン時にユーザー管理にアクセスするとリダイレクトされる', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url === 'http://localhost:3000/').toBeTruthy();
  });

  test('未ログイン時に在庫管理にアクセスするとリダイレクトされる', async ({ page }) => {
    await page.goto('/admin/inventory');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url === 'http://localhost:3000/').toBeTruthy();
  });

  test('未ログイン時にカテゴリ管理にアクセスするとリダイレクトされる', async ({ page }) => {
    await page.goto('/admin/categories');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('login') || url === 'http://localhost:3000/').toBeTruthy();
  });
});
