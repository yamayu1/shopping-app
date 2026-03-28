export const formatCurrency = (amount: number): string => {
  return `¥${Math.floor(amount).toLocaleString()}`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ja-JP');
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('ja-JP');
};

// truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// デバウンス（検索入力で使う）
// TODO: lodashのdebounce使ったほうがいいかも
export const debounce = (func: Function, wait: number) => {
  let timeout: any;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const isValidEmail = (email: string): boolean => {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^[\d\-()+\s]+$/.test(phone);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// capitalize first letter
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getImageUrl = (path: string): string => {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${path}`;
};

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

export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

// エラーメッセージの取得
// いろんなパターンがあるので場合分けしてる
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;

  // APIからのエラー
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // バリデーションエラー（配列で返ってくることがある）
  if (error?.response?.data?.errors) {
    let errors = error.response.data.errors;
    let firstError = Object.values(errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0] as string;
    }
    return firstError as string;
  }

  if (error?.message === 'Network Error') {
    return 'ネットワークエラーが発生しました。サーバーが起動しているか確認してください。';
  }

  // TODO: ステータスコード別のメッセージもっと増やしたい
  if (error?.response?.status === 404) return 'ページが見つかりません';
  if (error?.response?.status === 403) return 'アクセスが拒否されました';
  if (error?.response?.status === 500) return 'サーバーエラーが発生しました';

  if (error?.message) return error.message;

  return 'エラーが発生しました';
};

export const calculateCartTotal = (items: Array<{ price: number; quantity: number }>): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const calculateTax = (subtotal: number): number => {
  return Math.floor(subtotal * 0.1);
};

// 送料計算
export const calculateShipping = (subtotal: number): number => {
  // 5000円以上は送料無料
  return subtotal >= 5000 ? 0 : 500;
};
