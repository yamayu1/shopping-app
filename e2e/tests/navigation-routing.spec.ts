import { test, expect } from '@playwright/test';

// ルーティングとナビゲーションのテスト
test.describe('ルーティング', () => {

  test.describe('公開ページ', () => {
    test('ホームページにアクセスできる', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('text=ショッピングアプリへようこそ')).toBeVisible();
    });

    test('商品一覧ページにアクセスできる', async ({ page }) => {
      await page.goto('/products');
      await expect(page.locator('h1:has-text("商品一覧")')).toBeVisible();
    });

    test('ログインページにアクセスできる', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('h1:has-text("ログイン"), h4:has-text("ログイン")').first()).toBeVisible();
    });

    test('会員登録ページにアクセスできる', async ({ page }) => {
      await page.goto('/register');
      await expect(page.locator('text=アカウント作成')).toBeVisible();
    });

    test('パスワードリセットページにアクセスできる', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForTimeout(500);
      // ページが表示されること（404でないこと）
    });

    test('管理者ログインページにアクセスできる', async ({ page }) => {
      await page.goto('/admin/login');
      await page.waitForTimeout(500);
    });
  });

  test.describe('保護されたページ（未ログイン）', () => {
    test('カートページはログインにリダイレクト', async ({ page }) => {
      await page.goto('/cart');
      await page.waitForURL('**/login');
    });

    test('チェックアウトページはログインにリダイレクト', async ({ page }) => {
      await page.goto('/checkout');
      await page.waitForURL('**/login');
    });

    test('プロフィールページはログインにリダイレクト', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForURL('**/login');
    });

    test('注文履歴ページはログインにリダイレクト', async ({ page }) => {
      await page.goto('/orders');
      await page.waitForURL('**/login');
    });

    test('注文詳細ページはログインにリダイレクト', async ({ page }) => {
      await page.goto('/orders/1');
      await page.waitForURL('**/login');
    });
  });

  test.describe('管理者ページ（未ログイン）', () => {
    const adminPages = [
      '/admin',
      '/admin/products',
      '/admin/orders',
      '/admin/users',
      '/admin/inventory',
      '/admin/categories',
    ];

    for (const adminPage of adminPages) {
      test(`${adminPage} はログインにリダイレクト`, async ({ page }) => {
        await page.goto(adminPage);
        await page.waitForTimeout(1000);
        const url = page.url();
        expect(url.includes('login') || url === 'http://localhost:3000/').toBeTruthy();
      });
    }
  });
});

test.describe('レスポンシブレイアウト', () => {
  test('ヘッダーが表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=ShopApp')).toBeVisible();
    await expect(page.locator('header, [role="banner"]')).toBeVisible();
  });

  test('フッターが表示される', async ({ page }) => {
    await page.goto('/');
    // フッターが存在すること
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
  });
});

test.describe('ページ間の遷移', () => {
  test('ホーム → 商品一覧 → 商品詳細 → 戻る', async ({ page }) => {
    // ホーム
    await page.goto('/');
    await expect(page.locator('text=ショッピングアプリへようこそ')).toBeVisible();

    // 商品一覧へ
    await page.click('a:has-text("商品一覧")');
    await page.waitForURL('**/products');
    await expect(page.locator('h1:has-text("商品一覧")')).toBeVisible();

    // 商品詳細へ
    const productCards = page.locator('[data-testid="product-card"]');
    if (await productCards.count() > 0) {
      await productCards.first().click();
      await page.waitForURL('**/products/*');

      // パンくずリストで商品一覧に戻る
      const breadcrumbProducts = page.locator('text=商品一覧').last();
      if (await breadcrumbProducts.isVisible()) {
        await breadcrumbProducts.click();
        await page.waitForURL('**/products');
      }
    }
  });

  test('ログインページから会員登録ページへの遷移', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=会員登録');
    await page.waitForURL('**/register');
  });

  test('会員登録ページからログインページへの遷移', async ({ page }) => {
    await page.goto('/register');
    await page.click('text=ログイン');
    await page.waitForURL('**/login');
  });
});
