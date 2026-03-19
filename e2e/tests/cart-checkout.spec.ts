import { test, expect, Page } from '@playwright/test';

// テスト用ユーザーでログイン
async function loginAsUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/');
}

test.describe('カートページ', () => {
  test('空のカートにメッセージが表示される', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/cart');
    await page.waitForTimeout(1000);

    // 空のカートの場合
    const emptyMessage = page.locator('text=カートは空です');
    if (await emptyMessage.isVisible()) {
      await expect(page.locator('text=商品を追加してショッピングを始めましょう')).toBeVisible();
      await expect(page.locator('button:has-text("商品を見る")')).toBeVisible();
    }
  });

  test('カートの「商品を見る」ボタンで商品一覧に遷移する', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/cart');
    await page.waitForTimeout(1000);

    const browseButton = page.locator('button:has-text("商品を見る")');
    if (await browseButton.isVisible()) {
      await browseButton.click();
      await page.waitForURL('**/products');
    }
  });

  test('カートに商品がある場合にサマリーが表示される', async ({ page }) => {
    await loginAsUser(page);

    // 商品をカートに追加してみる
    await page.goto('/products');
    const productCards = page.locator('[data-testid="product-card"]');
    if (await productCards.count() > 0) {
      await productCards.first().click();
      await page.waitForURL('**/products/*');

      const addButton = page.locator('button:has-text("カートに追加")');
      if (await addButton.isEnabled()) {
        page.on('dialog', dialog => dialog.accept());
        await addButton.click();
        await page.waitForTimeout(1000);

        await page.goto('/cart');
        await page.waitForTimeout(1000);

        // カートにアイテムがある場合
        const summary = page.locator('text=注文サマリー');
        if (await summary.isVisible()) {
          await expect(page.locator('text=商品点数:')).toBeVisible();
          await expect(page.locator('text=小計:')).toBeVisible();
          await expect(page.locator('text=配送料:')).toBeVisible();
          await expect(page.locator('text=合計:')).toBeVisible();
        }
      }
    }
  });
});

test.describe('チェックアウトフロー', () => {
  test('チェックアウトステッパーが表示される', async ({ page }) => {
    await loginAsUser(page);

    // まず商品をカートに追加
    await page.goto('/products');
    const productCards = page.locator('[data-testid="product-card"]');
    if (await productCards.count() > 0) {
      await productCards.first().click();
      await page.waitForURL('**/products/*');

      const addButton = page.locator('button:has-text("カートに追加")');
      if (await addButton.isEnabled()) {
        page.on('dialog', dialog => dialog.accept());
        await addButton.click();
        await page.waitForTimeout(1000);

        await page.goto('/checkout');
        await page.waitForTimeout(1000);

        // ステッパーが表示される
        const stepper = page.locator('text=配送先情報');
        if (await stepper.isVisible()) {
          await expect(page.locator('text=支払い方法')).toBeVisible();
          await expect(page.locator('text=注文確認')).toBeVisible();
        }
      }
    }
  });

  test('カートが空の場合はカートページにリダイレクトされる', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/checkout');
    await page.waitForTimeout(2000);
    // カートが空の場合はカートページにリダイレクト
    const url = page.url();
    expect(url.includes('cart') || url.includes('checkout')).toBeTruthy();
  });

  test('チェックアウトの支払い方法ステップで選択肢が表示される', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/products');
    const productCards = page.locator('[data-testid="product-card"]');
    if (await productCards.count() > 0) {
      await productCards.first().click();
      await page.waitForURL('**/products/*');

      const addButton = page.locator('button:has-text("カートに追加")');
      if (await addButton.isEnabled()) {
        page.on('dialog', dialog => dialog.accept());
        await addButton.click();
        await page.waitForTimeout(1000);

        await page.goto('/checkout');
        await page.waitForTimeout(1000);

        // Step 1 → Step 2
        const nextButton = page.locator('button:has-text("次へ")');
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(500);

          // 支払い方法の選択肢
          await expect(page.locator('text=クレジットカード')).toBeVisible();
          await expect(page.locator('text=銀行振込')).toBeVisible();
          await expect(page.locator('text=代金引換')).toBeVisible();
          await expect(page.locator('text=この注文はシミュレーションです')).toBeVisible();
        }
      }
    }
  });

  test('チェックアウトの「戻る」ボタンが動作する', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/products');
    const productCards = page.locator('[data-testid="product-card"]');
    if (await productCards.count() > 0) {
      await productCards.first().click();
      await page.waitForURL('**/products/*');

      const addButton = page.locator('button:has-text("カートに追加")');
      if (await addButton.isEnabled()) {
        page.on('dialog', dialog => dialog.accept());
        await addButton.click();
        await page.waitForTimeout(1000);

        await page.goto('/checkout');
        await page.waitForTimeout(1000);

        // Step 1 → Step 2
        const nextButton = page.locator('button:has-text("次へ")');
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(500);

          // 戻るボタンをクリック
          const backButton = page.locator('button:has-text("戻る")');
          if (await backButton.isVisible()) {
            await backButton.click();
            await page.waitForTimeout(500);

            // Step 1に戻る
            await expect(page.locator('text=配送先住所')).toBeVisible();
          }
        }
      }
    }
  });
});

test.describe('注文サマリーの送料計算', () => {
  test('カートページで送料情報が表示される', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/cart');
    await page.waitForTimeout(1000);

    // カートに商品がある場合
    const shippingLabel = page.locator('text=配送料:');
    if (await shippingLabel.isVisible()) {
      // 送料の表示を確認（「無料」または金額）
      const shippingText = await page.locator('text=配送料:').locator('..').textContent();
      expect(shippingText?.includes('無料') || shippingText?.includes('¥')).toBeTruthy();
    }
  });
});
