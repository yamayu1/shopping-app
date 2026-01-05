// API設定
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ローカルストレージのキー
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  ADMIN_AUTH_TOKEN: 'admin_auth_token',
  ADMIN_USER_DATA: 'admin_user_data',
  CART_DATA: 'cart_data',
  THEME_MODE: 'theme_mode',
};

// ルート定義
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  ADMIN_LOGIN: '/admin/login',
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_USERS: '/admin/users',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_CATEGORIES: '/admin/categories',
};

// ページネーション
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PRODUCT_PAGE_SIZE: 12,
  ORDER_PAGE_SIZE: 10,
};

// 商品設定
export const PRODUCT = {
  MAX_IMAGES: 5,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5メガバイト
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// 注文ステータス
export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: '保留中', color: '#f59e0b' },
  { value: 'confirmed', label: '確認済み', color: '#3b82f6' },
  { value: 'processing', label: '処理中', color: '#8b5cf6' },
  { value: 'shipped', label: '発送済み', color: '#06b6d4' },
  { value: 'delivered', label: '配達完了', color: '#10b981' },
  { value: 'cancelled', label: 'キャンセル', color: '#ef4444' },
  { value: 'refunded', label: '返金済み', color: '#6b7280' },
];

// 支払いステータス
export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: '未払い', color: '#f59e0b' },
  { value: 'pending', label: '支払い待ち', color: '#f59e0b' },
  { value: 'paid', label: '支払い完了', color: '#10b981' },
  { value: 'failed', label: '支払い失敗', color: '#ef4444' },
  { value: 'refunded', label: '返金済み', color: '#6b7280' },
];

// ソートオプション
export const PRODUCT_SORT_OPTIONS = [
  { value: 'name-asc', label: '商品名 あ→ん' },
  { value: 'name-desc', label: '商品名 ん→あ' },
  { value: 'price-asc', label: '価格 安い順' },
  { value: 'price-desc', label: '価格 高い順' },
  { value: 'created_at-desc', label: '新着順' },
];

// バリデーション
export const VALIDATION_RULES = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[\d\-()+\s]{10,15}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 1000,
  SKU_PATTERN: /^[A-Z0-9-]{3,20}$/,
};

// ここにまとめすぎかも...
export const CART = {
  MAX_QUANTITY: 99,
  MIN_QUANTITY: 1,
};

export const CURRENCY = {
  CODE: 'JPY',
  SYMBOL: '¥',
  LOCALE: 'ja-JP',
};

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  UNAUTHORIZED: 'ログインが必要です。',
  FORBIDDEN: 'アクセスが拒否されました。',
  NOT_FOUND: 'ページが見つかりません。',
  SERVER_ERROR: 'サーバーエラーが発生しました。',
  VALIDATION_ERROR: '入力内容を確認してください。',
  GENERIC_ERROR: 'エラーが発生しました。',
};

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'ログインしました！',
  LOGOUT_SUCCESS: 'ログアウトしました！',
  REGISTER_SUCCESS: 'アカウントを作成しました！',
  PROFILE_UPDATED: 'プロフィールを更新しました！',
  PRODUCT_ADDED: '商品を追加しました！',
  PRODUCT_UPDATED: '商品を更新しました！',
  PRODUCT_DELETED: '商品を削除しました！',
  CART_UPDATED: 'カートを更新しました！',
  ORDER_PLACED: '注文を受け付けました！',
};
