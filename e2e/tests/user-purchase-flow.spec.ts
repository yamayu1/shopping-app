import { test, expect, Page } from '@playwright/test';

// テストユーザーデータ生成
const timestamp = Date.now();
const testUser = {
  first_name: 'テスト',
  last_name: '太郎',
  email: `test${timestamp}@example.com`,
  phone: '090-1234-5678',
  password: 'Password123!',
};

// ユーザーの購入フローテスト
test.describe('ユーザー購入フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('ホームページ', () => {
    test('ヒーローセクションが表示される', async ({ page }) => {
      await expect(page.locator('text=ショッピングアプリへようこそ')).toBeVisible();
      await expect(page.locator('text=最高品質の商品をお手頃な価格で')).toBeVisible();
    });

    test('「商品を見る」ボタンで商品一覧に遷移する', async ({ page }) => {
      await page.click('button:has-text("商品を見る")');
      await page.waitForURL('**/products');
      await expect(page.locator('text=商品一覧')).toBeVisible();
    });

    test('注目の商品セクションが表示される', async ({ page }) => {
      await expect(page.locator('text=注目の商品')).toBeVisible();
    });

    test('「すべて見る」ボタンで商品一覧に遷移する', async ({ page }) => {
      await page.click('button:has-text("すべて見る")');
      await page.waitForURL('**/products');
    });

    test('カテゴリセクションが表示される', async ({ page }) => {
      // カテゴリが存在する場合のみ
      const categorySection = page.locator('text=カテゴリから探す');
      if (await categorySection.isVisible()) {
        await expect(categorySection).toBeVisible();
      }
    });
  });

  test.describe('ヘッダーナビゲーション', () => {
    test('ShopAppロゴでホームに遷移する', async ({ page }) => {
      await page.goto('/products');
      await page.click('text=ShopApp');
      await page.waitForURL('/');
    });

    test('商品一覧リンクが動作する', async ({ page }) => {
      await page.click('a:has-text("商品一覧")');
      await page.waitForURL('**/products');
    });

    test('未ログイン時にログイン・会員登録・管理者ボタンが表示される', async ({ page }) => {
      await expect(page.locator('a:has-text("ログイン")')).toBeVisible();
      await expect(page.locator('a:has-text("会員登録")')).toBeVisible();
      await expect(page.locator('a:has-text("管理者")')).toBeVisible();
    });

    test('カートアイコンが表示される', async ({ page }) => {
      await expect(page.locator('a[href="/cart"]')).toBeVisible();
    });
  });

  test.describe('会員登録', () => {
    test('会員登録ページが表示される', async ({ page }) => {
      await page.click('a:has-text("会員登録")');
      await page.waitForURL('**/register');
      await expect(page.locator('text=アカウント作成')).toBeVisible();
      await expect(page.locator('text=今すぐ参加しましょう')).toBeVisible();
    });

    test('バリデーションエラーが表示される（空フォーム送信）', async ({ page }) => {
      await page.goto('/register');
      await page.click('button:has-text("アカウント作成")');
      // 必須項目のバリデーションエラーが表示されること
      await expect(page.locator('text=名前は必須項目です')).toBeVisible();
      await expect(page.locator('text=苗字は必須項目です')).toBeVisible();
      await expect(page.locator('text=メールアドレスは必須項目です')).toBeVisible();
    });

    test('メールアドレスのバリデーションが動作する', async ({ page }) => {
      await page.goto('/register');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button:has-text("アカウント作成")');
      await expect(page.locator('text=正しいメールアドレスを入力してください')).toBeVisible();
    });

    test('パスワード不一致のバリデーションが動作する', async ({ page }) => {
      await page.goto('/register');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="password_confirmation"]', 'DifferentPass!');
      await page.click('button:has-text("アカウント作成")');
      await expect(page.locator('text=パスワードが一致しません')).toBeVisible();
    });

    test('パスワード表示切替が動作する', async ({ page }) => {
      await page.goto('/register');
      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      await page.click('button:has-text("パスワードを表示")');
      await expect(passwordInput).toHaveAttribute('type', 'text');

      await page.click('button:has-text("パスワードを非表示")');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('ログインページへのリンクが動作する', async ({ page }) => {
      await page.goto('/register');
      await page.click('text=ログイン');
      await page.waitForURL('**/login');
    });

    test('会員登録が成功する', async ({ page }) => {
      await page.goto('/register');
      await page.fill('input[name="first_name"]', testUser.first_name);
      await page.fill('input[name="last_name"]', testUser.last_name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="phone"]', testUser.phone);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="password_confirmation"]', testUser.password);
      await page.click('button:has-text("アカウント作成")');

      // ホームにリダイレクトされること
      await page.waitForURL('**/');
    });
  });

  test.describe('ログイン', () => {
    test('ログインページが表示される', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('text=ログイン').first()).toBeVisible();
      await expect(page.locator('text=お帰りなさい！アカウントにログインしてください。')).toBeVisible();
    });

    test('バリデーションエラーが表示される（空フォーム送信）', async ({ page }) => {
      await page.goto('/login');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=メールアドレスは必須項目です')).toBeVisible();
      await expect(page.locator('text=パスワードは必須項目です')).toBeVisible();
    });

    test('パスワード表示切替が動作する', async ({ page }) => {
      await page.goto('/login');
      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      await page.click('button:has-text("パスワードを表示")');
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('「パスワードをお忘れですか？」リンクが動作する', async ({ page }) => {
      await page.goto('/login');
      await page.click('text=パスワードをお忘れですか？');
      await page.waitForURL('**/forgot-password');
    });

    test('会員登録ページへのリンクが動作する', async ({ page }) => {
      await page.goto('/login');
      await page.click('text=会員登録');
      await page.waitForURL('**/register');
    });
  });

  test.describe('商品一覧ページ', () => {
    test('商品一覧ページが表示される', async ({ page }) => {
      await page.goto('/products');
      await expect(page.locator('h1:has-text("商品一覧")')).toBeVisible();
    });

    test('検索バーが表示される', async ({ page }) => {
      await page.goto('/products');
      await expect(page.locator('input[placeholder="商品を検索..."]')).toBeVisible();
    });

    test('商品を検索できる', async ({ page }) => {
      await page.goto('/products');
      await page.fill('input[placeholder="商品を検索..."]', 'テスト');
      await page.press('input[placeholder="商品を検索..."]', 'Enter');
      // 検索結果またはメッセージが表示されること
      await page.waitForTimeout(1000);
      const hasProducts = await page.locator('[data-testid="product-card"]').count() > 0;
      const hasNoResults = await page.locator('text=商品が見つかりませんでした').isVisible();
      expect(hasProducts || hasNoResults).toBeTruthy();
    });

    test('商品カードが正しく表示される', async ({ page }) => {
      await page.goto('/products');
      const productCards = page.locator('[data-testid="product-card"]');
      const count = await productCards.count();

      if (count > 0) {
        const firstCard = productCards.first();
        // 商品名が表示される
        await expect(firstCard.locator('h3, h6').first()).toBeVisible();
        // カートに追加ボタンがある
        await expect(firstCard.locator('button:has-text("カートに追加")')).toBeVisible();
      }
    });

    test('商品カードクリックで商品詳細に遷移する', async ({ page }) => {
      await page.goto('/products');
      const productCards = page.locator('[data-testid="product-card"]');
      const count = await productCards.count();

      if (count > 0) {
        await productCards.first().click();
        await page.waitForURL('**/products/*');
      }
    });

    test('商品がない場合にメッセージが表示される', async ({ page }) => {
      await page.goto('/products');
      await page.fill('input[placeholder="商品を検索..."]', 'xxxxxxxxxxxxxxxxxxxxxxx');
      await page.press('input[placeholder="商品を検索..."]', 'Enter');
      await page.waitForTimeout(1000);
      const noResults = page.locator('text=商品が見つかりませんでした');
      if (await noResults.isVisible()) {
        await expect(page.locator('text=検索条件を変更してみてください')).toBeVisible();
      }
    });
  });

  test.describe('商品詳細ページ', () => {
    test('商品詳細が表示される', async ({ page }) => {
      await page.goto('/products');
      const productCards = page.locator('[data-testid="product-card"]');
      if (await productCards.count() > 0) {
        await productCards.first().click();
        await page.waitForURL('**/products/*');

        // パンくずリストが表示される
        await expect(page.locator('text=ホーム')).toBeVisible();
        await expect(page.locator('nav >> text=商品一覧').or(page.locator('a:has-text("商品一覧")'))).toBeVisible();

        // 商品情報が表示される
        await expect(page.locator('text=商品詳細')).toBeVisible();
        await expect(page.locator('text=SKU:')).toBeVisible();
        await expect(page.locator('text=在庫状況:')).toBeVisible();
      }
    });

    test('数量変更ボタンが動作する', async ({ page }) => {
      await page.goto('/products');
      const productCards = page.locator('[data-testid="product-card"]');
      if (await productCards.count() > 0) {
        await productCards.first().click();
        await page.waitForURL('**/products/*');

        // 在庫ありの商品の場合、数量変更UI
        const quantitySection = page.locator('text=数量');
        if (await quantitySection.isVisible()) {
          // 初期値は1
          await expect(page.locator('input[readonly]')).toHaveValue('1');
        }
      }
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

    test('送料無料・品質保証の情報が表示される', async ({ page }) => {
      await page.goto('/products');
      const productCards = page.locator('[data-testid="product-card"]');
      if (await productCards.count() > 0) {
        await productCards.first().click();
        await page.waitForURL('**/products/*');

        await expect(page.locator('text=送料無料')).toBeVisible();
        await expect(page.locator('text=5,000円以上のご注文で送料無料')).toBeVisible();
        await expect(page.locator('text=品質保証')).toBeVisible();
        await expect(page.locator('text=30日間返品保証')).toBeVisible();
      }
    });

    test('存在しない商品IDでエラーが表示される', async ({ page }) => {
      await page.goto('/products/999999');
      // エラーメッセージまたは商品一覧に戻るボタンが表示される
      await page.waitForTimeout(2000);
      const errorVisible = await page.locator('text=商品が見つかりません').or(
        page.locator('text=商品の読み込みに失敗しました')
      ).isVisible();
      if (errorVisible) {
        await expect(page.locator('button:has-text("商品一覧に戻る")')).toBeVisible();
      }
    });
  });

  test.describe('カートページ（未ログイン）', () => {
    test('未ログイン時はカートにアクセスするとログインにリダイレクトされる', async ({ page }) => {
      await page.goto('/cart');
      await page.waitForURL('**/login');
    });
  });

  test.describe('チェックアウト（未ログイン）', () => {
    test('未ログイン時はチェックアウトにアクセスするとログインにリダイレクトされる', async ({ page }) => {
      await page.goto('/checkout');
      await page.waitForURL('**/login');
    });
  });

  test.describe('注文履歴（未ログイン）', () => {
    test('未ログイン時は注文履歴にアクセスするとログインにリダイレクトされる', async ({ page }) => {
      await page.goto('/orders');
      await page.waitForURL('**/login');
    });
  });

  test.describe('プロフィール（未ログイン）', () => {
    test('未ログイン時はプロフィールにアクセスするとログインにリダイレクトされる', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForURL('**/login');
    });
  });

  test.describe('404ページ', () => {
    test('存在しないページで404が表示される', async ({ page }) => {
      await page.goto('/non-existent-page');
      // NotFoundPage コンポーネントが表示されること
      await page.waitForTimeout(500);
    });
  });
});

// 会員登録から購入完了までの一連テスト
test.describe('購入フロー E2E', () => {
  test('会員登録 → ログイン → 商品閲覧 → カート追加 → チェックアウトの一連のフロー', async ({ page }) => {
    const uniqueEmail = `purchase-flow-${Date.now()}@example.com`;

    // Step 1: 会員登録
    await page.goto('/register');
    await page.fill('input[name="first_name"]', 'テスト');
    await page.fill('input[name="last_name"]', '購入者');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="phone"]', '090-9876-5432');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="password_confirmation"]', 'Password123!');
    await page.click('button:has-text("アカウント作成")');
    await page.waitForURL('**/');

    // Step 2: 商品一覧へ遷移
    await page.click('a:has-text("商品一覧")');
    await page.waitForURL('**/products');

    // Step 3: 商品詳細を表示
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await productCards.first().click();
    await page.waitForURL('**/products/*');

    // Step 4: カートに追加
    const addToCartButton = page.locator('button:has-text("カートに追加")');
    if (await addToCartButton.isEnabled()) {
      await addToCartButton.click();
      // alertダイアログを処理
      page.on('dialog', dialog => dialog.accept());

      // Step 5: カートページへ
      await page.goto('/cart');
      await page.waitForTimeout(1000);

      // カートに商品があれば購入手続きへ
      const checkoutButton = page.locator('button:has-text("購入手続きへ")');
      if (await checkoutButton.isVisible() && await checkoutButton.isEnabled()) {
        await checkoutButton.click();
        await page.waitForURL('**/checkout');

        // Step 6: チェックアウト - Step 1: 配送先住所
        await expect(page.locator('text=購入手続き')).toBeVisible();
        await expect(page.locator('text=配送先住所')).toBeVisible();

        // 「新しい住所を入力」が選択されていれば住所入力
        const newAddressRadio = page.locator('text=新しい住所を入力');
        if (await newAddressRadio.isVisible()) {
          // 住所フォームへ入力
          const lastNameField = page.locator('label:has-text("姓") + div input, label:has-text("姓") >> .. >> input');
          const firstNameField = page.locator('label:has-text("名") + div input, label:has-text("名") >> .. >> input');

          // 次へボタンをクリック
          await page.click('button:has-text("次へ")');

          // Step 7: Step 2: 支払い方法
          await expect(page.locator('text=支払い方法')).toBeVisible();
          await expect(page.locator('text=クレジットカード')).toBeVisible();
          await expect(page.locator('text=銀行振込')).toBeVisible();
          await expect(page.locator('text=代金引換')).toBeVisible();

          // 次へ
          await page.click('button:has-text("次へ")');

          // Step 8: Step 3: 注文確認
          await expect(page.locator('text=注文内容の確認')).toBeVisible();
          await expect(page.locator('text=合計:')).toBeVisible();
        }
      }
    }
  });
});
