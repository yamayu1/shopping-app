# テスト実装サマリー

## 実装済みテスト

### User API（Rails / Minitest）
- ユーザーモデルのバリデーションテスト
- 商品モデルのテスト（在庫管理含む）
- 認証APIのテスト（登録・ログイン・ログアウト）
- 商品APIのテスト（一覧・詳細・検索）
- 購入フローの統合テスト

### Admin API（Laravel / PHPUnit）
- 商品モデルの単体テスト
- 商品CRUD APIのフィーチャーテスト
- 管理者ワークフローのシステムテスト

### Frontend（React / Jest）
- コンポーネントの描画テスト
- ユーザー操作テスト

### E2E（Playwright）
- ユーザー購入フロー
- 管理者業務フロー

## テスト実行

```bash
make test
```

詳細は TESTING.md を参照。
