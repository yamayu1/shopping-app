# Shopping App - ECサイト

Amazon風のECサイトです。React + Rails + Laravel で構成しています。

## 構成

- フロントエンド: React（TypeScript）
- ユーザー向けAPI: Ruby on Rails（Sinatra）
- 管理者向けAPI: Laravel（PHP）
- データベース: MySQL 8.0
- セッション管理: Redis
- コンテナ: Docker / Docker Compose

## 機能一覧

### ユーザー向け
- 会員登録・ログイン
- 商品一覧・詳細ページ
- カート機能
- 注文機能（決済はシミュレーション）
- 注文履歴
- プロフィール・住所管理
- パスワードリセット

### 管理者向け
- 管理者ログイン
- 商品管理（登録・編集・削除・画像アップロード）
- カテゴリ管理
- 在庫管理
- 注文管理
- 在庫CSVエクスポート（毎朝9時に自動実行）

## 起動方法

```bash
# ビルドして起動
make setup

# または
docker-compose up --build
```

起動したらブラウザで以下にアクセス：
- フロントエンド: http://localhost:3000
- User API: http://localhost:3001
- Admin API: http://localhost:8000

### テスト用アカウント

- ユーザー: user@example.com / password123
- 管理者: admin@example.com / admin123

## 開発コマンド

```bash
make up          # コンテナ起動
make down        # コンテナ停止
make logs        # ログ確認
make test        # 全テスト実行
make test-rails  # Rails テストのみ
make test-laravel # Laravel テストのみ
make test-frontend # フロントエンドテストのみ
make migrate     # マイグレーション実行
make seed        # シードデータ投入
```

## テストについて

テストは Small / Medium / Big の3層で実装しています。

- Small（単体テスト）: モデルのバリデーション、ビジネスロジック
- Medium（結合テスト）: APIエンドポイント、認証フロー
- Big（E2Eテスト）: Playwrightによるブラウザテスト

```bash
# 全テスト実行
make test

# カバレッジレポート付き
cd user-api && bundle exec rake test
cd admin-api && php artisan test --coverage
cd frontend && npm test -- --coverage
```

## ディレクトリ構成

```
shopping-app/
├── frontend/          # React フロントエンド
├── user-api/          # Rails ユーザー向けAPI
├── admin-api/         # Laravel 管理者向けAPI
├── e2e/               # E2Eテスト（Playwright）
├── scheduler/         # 在庫CSV出力スケジューラ
├── database/          # DB初期化SQL
├── docs/              # ドキュメント
├── docker-compose.yml
└── Makefile
```

## 使用技術の選定理由

詳細は `docs/SYSTEM_DESIGN.md` に記載しています。
