# 管理者向けAPI（Laravel）

ショッピングアプリの管理者向けバックエンドAPIです。
JWT認証でログインして、商品管理や在庫管理ができるようにしています。

## セットアップ

基本的には `docker-compose up` で起動できます。
個別に動かす場合は以下のコマンドを実行してください。

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve --port=8000
```

## 主なAPI

### 認証
- `POST /api/admin/login` - ログイン
- `POST /api/admin/auth/logout` - ログアウト
- `POST /api/admin/auth/refresh` - トークン更新
- `GET /api/admin/auth/me` - 自分の情報取得

### 商品管理
- `GET /api/admin/products` - 商品一覧（フィルター付き）
- `POST /api/admin/products` - 商品登録
- `GET /api/admin/products/{id}` - 商品詳細
- `PUT /api/admin/products/{id}` - 商品更新
- `DELETE /api/admin/products/{id}` - 商品削除
- `PUT /api/admin/products/{id}/toggle-status` - 販売停止/再開

### カテゴリ管理
- `GET /api/admin/categories` - カテゴリ一覧
- `POST /api/admin/categories` - カテゴリ作成
- `PUT /api/admin/categories/{id}` - カテゴリ更新
- `DELETE /api/admin/categories/{id}` - カテゴリ削除

### 注文管理
- `GET /api/admin/orders` - 注文一覧
- `GET /api/admin/orders/{orderNumber}` - 注文詳細
- `PUT /api/admin/orders/{orderNumber}/status` - ステータス更新

### 在庫管理
- `GET /api/admin/inventory` - 在庫一覧
- `PUT /api/admin/inventory/products/{id}/stock` - 在庫更新
- `GET /api/admin/inventory/low-stock` - 在庫不足アラート
- `GET /api/admin/inventory/export` - CSV出力

## テスト用アカウント

| メールアドレス | パスワード | 権限 |
|---|---|---|
| admin@example.com | admin123 | 管理者 |

## テスト

```bash
php artisan test
```

## 構成

Laravelの標準的なディレクトリ構成に準拠しています。

- `app/Http/Controllers/` - APIの処理
- `app/Models/` - データベースのモデル
- `app/Http/Middleware/` - 認証やCORS等のミドルウェア
- `database/migrations/` - テーブル定義
- `routes/api.php` - ルーティング

## 工夫した点

- レスポンス形式の統一のため、ベースのControllerに`successResponse`と`errorResponse`ヘルパーを定義し共通化した
- 在庫更新時にログを記録し、変更者と変更日時を追跡できるようにした
- 商品画像のアップロード時にファイル名をランダム文字列で生成し、ファイル名の重複を防止している
