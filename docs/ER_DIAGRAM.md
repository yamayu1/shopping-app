# ER図

## テーブル関連図

```mermaid
erDiagram
    USERS ||--o{ ADDRESSES : "住所を持つ"
    USERS ||--|| CARTS : "カートを持つ"
    USERS ||--o{ ORDERS : "注文する"
    CATEGORIES ||--o{ PRODUCTS : "商品を含む"
    CARTS ||--o{ CART_ITEMS : "商品を含む"
    PRODUCTS ||--o{ CART_ITEMS : "カートに入る"
    ORDERS ||--o{ ORDER_ITEMS : "商品を含む"
    PRODUCTS ||--o{ ORDER_ITEMS : "注文される"
    ADDRESSES ||--o{ ORDERS : "配送先"
    ADMINS ||--o{ INVENTORY_LOGS : "在庫を管理"
    PRODUCTS ||--o{ INVENTORY_LOGS : "在庫ログ"

    USERS {
        bigint id PK
        string email UK
        string password_digest
        string first_name
        string last_name
        string phone
        date birth_date
        boolean is_active
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }

    ADDRESSES {
        bigint id PK
        bigint user_id FK
        string name
        string address_line_1
        string address_line_2
        string city
        string state
        string postal_code
        string country
        string phone
        boolean is_default
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        bigint id PK
        string name
        string slug UK
        text description
        boolean active
        integer sort_order
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK
        string name
        text description
        string sku UK
        decimal price
        decimal sale_price
        integer stock_quantity
        integer low_stock_threshold
        boolean is_active
        boolean is_featured
        json images
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
    }

    CARTS {
        bigint id PK
        bigint user_id FK
        timestamp created_at
        timestamp updated_at
    }

    CART_ITEMS {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        integer quantity
        timestamp created_at
        timestamp updated_at
    }

    ORDERS {
        bigint id PK
        bigint user_id FK
        bigint address_id FK
        string order_number UK
        decimal total_amount
        string status
        string payment_status
        string payment_method
        string payment_transaction_id
        text notes
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        integer quantity
        decimal price
        timestamp created_at
        timestamp updated_at
    }

    ADMINS {
        bigint id PK
        string name
        string email UK
        string password
        string role
        boolean is_active
        timestamp last_login_at
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY_LOGS {
        bigint id PK
        bigint product_id FK
        bigint admin_id FK
        integer quantity_change
        integer quantity_after
        string reason
        timestamp created_at
        timestamp updated_at
    }
```

## 補足

- usersテーブルにはRails用の `password_digest` とLaravel用の `password` カラムが両方ある。RailsとLaravelで同じDBを見ているのでこうなってしまった。正直あまりきれいではないが、フレームワークごとにパスワードのハッシュ形式が違うので仕方なかった
- ordersの `status` は最初integerで管理していたが、コードを読むときに「status = 2って何だっけ？」といちいち定義を見に行くのが面倒だったので、文字列（pending, confirmed, shipped等）に変えた
- ユーザーや商品は物理削除（DELETE）ではなく、`deleted_at` に日時を入れる論理削除にした。物理削除すると注文履歴から「誰が何を買ったか」が分からなくなってしまうため
- emailやSKUなど、WHERE句で検索することが多いカラムにはインデックスを付けた。付けないと全件スキャンになるので、データが増えたときに遅くなるのを防ぐため
