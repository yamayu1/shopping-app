# コンポーネント図

## 全体構成

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│                  (React App)                     │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Pages   │ │Components│ │    Contexts       │ │
│  │ ・Home   │ │ ・Header │ │ ・AuthContext     │ │
│  │ ・Product│ │ ・Footer │ │ ・CartContext     │ │
│  │ ・Cart   │ │ ・Forms  │ │ ・ThemeContext    │ │
│  │ ・Order  │ │ ・Cards  │ │                   │ │
│  │ ・Admin  │ │          │ │                   │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────────────────────────────────────────┐│
│  │              Services (API通信)              ││
│  │  authService / productService / cartService  ││
│  │  orderService / adminAuthService ...         ││
│  └──────────────────────────────────────────────┘│
└──────────────┬────────────────────┬──────────────┘
               │ HTTP (JWT)         │ HTTP (JWT)
               ▼                    ▼
┌──────────────────────┐ ┌──────────────────────────┐
│   User API (Rails)   │ │   Admin API (Laravel)    │
│                      │ │                          │
│ ┌──────────────────┐ │ │ ┌──────────────────────┐ │
│ │   Controllers    │ │ │ │    Controllers       │ │
│ │ ・Authentication │ │ │ │ ・Auth               │ │
│ │ ・Products       │ │ │ │ ・Product            │ │
│ │ ・Carts          │ │ │ │ ・Order              │ │
│ │ ・Orders         │ │ │ │ ・Inventory          │ │
│ │ ・Addresses      │ │ │ │ ・Category           │ │
│ │ ・Profiles       │ │ │ │ ・User               │ │
│ └──────────────────┘ │ │ └──────────────────────┘ │
│ ┌──────────────────┐ │ │ ┌──────────────────────┐ │
│ │     Models       │ │ │ │      Models          │ │
│ │ ・User           │ │ │ │ ・Admin              │ │
│ │ ・Product        │ │ │ │ ・Product            │ │
│ │ ・Cart/CartItem  │ │ │ │ ・Order/OrderItem    │ │
│ │ ・Order/OrderItem│ │ │ │ ・Category           │ │
│ │ ・Address        │ │ │ │ ・InventoryLog       │ │
│ │ ・Category       │ │ │ │ ・Cart/CartItem      │ │
│ └──────────────────┘ │ │ └──────────────────────┘ │
│ ┌──────────────────┐ │ │ ┌──────────────────────┐ │
│ │   Middleware     │ │ │ │    Middleware         │ │
│ │ ・JWT認証        │ │ │ │ ・JWT認証             │ │
│ │                  │ │ │ │ ・権限チェック         │ │
│ │                  │ │ │ │ ・CORS                │ │
│ └──────────────────┘ │ │ └──────────────────────┘ │
└──────────┬───────────┘ └─────────────┬────────────┘
           │                           │
           ▼                           ▼
┌──────────────────────────────────────────────────┐
│                  MySQL 8.0                        │
│  users / products / orders / carts / admins ...  │
└──────────────────────────────────────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌──────────┐ ┌────────────────┐
│  Redis   │ │  Scheduler     │
│ セッション│ │ (cron)         │
│ 管理     │ │ 毎朝9時に      │
│          │ │ 在庫CSV出力     │
└──────────┘ └────────────────┘
```

## 各レイヤーの説明

### Frontend（React）
- **Pages**: 各画面のコンポーネント。ルーティングで切り替わる
- **Components**: 再利用可能なUIパーツ（ヘッダー、フォーム、カードなど）
- **Contexts**: グローバルな状態管理。認証状態とカートの中身をContext APIで管理している
- **Services**: バックエンドAPIとの通信をまとめたレイヤー。axiosのインスタンスにJWTトークンを自動付与するインターセプターを設定している

### User API（Rails）
- ユーザー向けの機能を担当
- 商品の閲覧、カート操作、注文、会員情報の管理など
- has_secure_passwordでパスワードをbcryptでハッシュ化している

### Admin API（Laravel）
- 管理者向けの機能を担当
- 商品の登録・編集、在庫管理、注文管理など
- tymon/jwt-authでJWT認証を実装
- ミドルウェアで権限チェックしている

### データベース
- RailsとLaravelで同じMySQLデータベースを参照している
- テーブルの作成はRails側のマイグレーションで行い、Laravel側では微調整のみ

### Redis
- セッションデータの保存に使用
- ファイルに保存するよりも高速
