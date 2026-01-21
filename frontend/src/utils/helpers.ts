// 価格表示のフォーマット
export const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString()}`;
};

// 日付フォーマット
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ja-JP');
};

// 日時フォーマット
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('ja-JP');
};

// テキストを指定文字数で切る
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// デバウンス（検索入力で使う）
export const debounce = (func: Function, wait: number) => {
  let timeout: any;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// メールアドレスのバリデーション
export const isValidEmail = (email: string): boolean => {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
};

// 電話番号のバリデーション
export const isValidPhone = (phone: string): boolean => {
  return /^[\d\-()+\s]+$/.test(phone);
};

// パスワードのバリデーション
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// 先頭を大文字にする
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// 画像URLの取得
export const getImageUrl = (path: string): string => {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${path}`;
};

// クエリパラメータの作成
export const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
};

// ローカルストレージの読み書き
export const getFromStorage = (key: string, defaultValue: any): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('localStorageの保存に失敗:', error);
  }
};

export const removeFromStorage = (key: string): void => {
  localStorage.removeItem(key);
};

// 画像ファイルかどうかの判定
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

// エラーメッセージの取得
export const getErrorMessage = (error: any): string => {
  console.log('エラー:', error);

  if (typeof error === 'string') return error;

  // APIからのエラーメッセージ
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // バリデーションエラー
  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    const firstError = Object.values(errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0] as string;
    }
    return firstError as string;
  }

  // ネットワークエラー
  if (error?.message === 'Network Error') {
    return 'ネットワークエラーが発生しました。サーバーが起動しているか確認してください。';
  }

  // HTTPステータスコードによるエラー
  if (error?.response?.status) {
    const status = error.response.status;
    if (status === 404) return 'リソースが見つかりません';
    if (status === 403) return 'アクセスが拒否されました';
    if (status === 500) return 'サーバーエラーが発生しました';
  }

  if (error?.message) return error.message;

  return '予期しないエラーが発生しました';
};

// カート合計の計算
export const calculateCartTotal = (items: Array<{ price: number; quantity: number }>): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// 税金計算（消費税10%）
export const calculateTax = (subtotal: number): number => {
  return Math.floor(subtotal * 0.1);
};

// 送料計算
export const calculateShipping = (subtotal: number): number => {
  // 5000円以上は送料無料
  return subtotal >= 5000 ? 0 : 500;
};
