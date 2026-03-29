# テスト実装ガイド

## テスト構成

Small / Medium / Big の3層でテストを実装しています。

| レイヤー | フレームワーク | テスト種別 |
|---------|--------------|-----------|
| User API (Rails) | Minitest | Small / Medium / Big |
| Admin API (Laravel) | PHPUnit | Unit / Feature / System |
| Frontend (React) | Jest | Component テスト |
| E2E | Playwright | ブラウザテスト |

## テスト実行方法

```bash
# 全テスト実行
make test

# 個別実行
make test-rails
make test-laravel
make test-frontend

# E2E テスト（コンテナ起動後）
cd e2e && npx playwright test
```

## Rails テスト（user-api）

### Small テスト（単体）
- モデルのバリデーション
- ビジネスロジック（在庫管理等）

### Medium テスト（結合）
- 認証APIのテスト
- 商品APIのテスト

### Big テスト（システム）
- 会員登録→商品閲覧→カート→購入の一連のフロー

## Laravel テスト（admin-api）

### Unit テスト
- 商品モデルのテスト

### Feature テスト
- 商品CRUD APIテスト

### System テスト
- 管理者の業務フローテスト

## フロントエンドテスト

Jest + React Testing Library でコンポーネントテスト。

## E2E テスト

Playwright でChrome, Firefox, Safari（WebKit）でテスト。

## カバレッジ確認

```bash
cd user-api && bundle exec rake test   # coverage/に出力
cd admin-api && php artisan test --coverage
cd frontend && npm test -- --coverage
```
