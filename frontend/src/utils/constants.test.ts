import {
  STORAGE_KEYS,
  ROUTES,
  PAGINATION,
  VALIDATION_RULES,
  CURRENCY,
  ERROR_MESSAGES,
} from './constants';

describe('constants', () => {
  describe('STORAGE_KEYS', () => {
    it('has all required storage keys', () => {
      expect(STORAGE_KEYS.AUTH_TOKEN).toBe('auth_token');
      expect(STORAGE_KEYS.USER_DATA).toBe('user_data');
      expect(STORAGE_KEYS.CART_DATA).toBe('cart_data');
    });
  });

  describe('ROUTES', () => {
    it('has all required route paths', () => {
      expect(ROUTES.HOME).toBe('/');
      expect(ROUTES.LOGIN).toBe('/login');
      expect(ROUTES.REGISTER).toBe('/register');
      expect(ROUTES.CART).toBe('/cart');
      expect(ROUTES.CHECKOUT).toBe('/checkout');
    });
  });

  describe('PAGINATION', () => {
    it('has positive page sizes', () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(PAGINATION.PRODUCT_PAGE_SIZE).toBeGreaterThan(0);
    });
  });

  describe('VALIDATION_RULES', () => {
    it('has valid email regex', () => {
      expect(VALIDATION_RULES.EMAIL.test('test@example.com')).toBe(true);
      expect(VALIDATION_RULES.EMAIL.test('invalid')).toBe(false);
    });

    it('has valid phone regex', () => {
      expect(VALIDATION_RULES.PHONE.test('090-1234-5678')).toBe(true);
      expect(VALIDATION_RULES.PHONE.test('abc')).toBe(false);
    });
  });

  describe('CURRENCY', () => {
    it('is configured for Japanese Yen', () => {
      expect(CURRENCY.CODE).toBe('JPY');
      expect(CURRENCY.SYMBOL).toBe('¥');
      expect(CURRENCY.LOCALE).toBe('ja-JP');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('has all required error messages', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeTruthy();
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBeTruthy();
      expect(ERROR_MESSAGES.NOT_FOUND).toBeTruthy();
    });
  });
});
