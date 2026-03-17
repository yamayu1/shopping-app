import {
  formatCurrency,
  formatDate,
  formatDateTime,
  truncateText,
  capitalize,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  calculateCartTotal,
  calculateTax,
  calculateShipping,
  getErrorMessage,
} from './helpers';

describe('helpers', () => {
  describe('formatCurrency', () => {
    it('formats numbers as currency', () => {
      expect(formatCurrency(1000)).toBe('¥1,000');
      expect(formatCurrency(0)).toBe('¥0');
    });
  });

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('1');
      expect(formatted).toContain('15');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDateTime(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('1');
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncateText(text, 20)).toBe('This is a very long ...');
    });

    it('does not truncate short text', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('tEsT')).toBe('Test');
    });
  });

  describe('validation helpers', () => {
    describe('isValidEmail', () => {
      it('validates correct emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user+tag@domain.co.jp')).toBe(true);
      });

      it('invalidates incorrect emails', () => {
        expect(isValidEmail('invalid')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
      });
    });

    describe('isValidPhone', () => {
      it('validates correct phone numbers', () => {
        expect(isValidPhone('+1-555-1234')).toBe(true);
        expect(isValidPhone('(555) 123-4567')).toBe(true);
        expect(isValidPhone('555-1234')).toBe(true);
      });

      it('invalidates incorrect phone numbers', () => {
        expect(isValidPhone('invalid')).toBe(false);
        expect(isValidPhone('abc-defg')).toBe(false);
      });
    });

    describe('isValidPassword', () => {
      it('validates password length', () => {
        expect(isValidPassword('password123')).toBe(true);
        expect(isValidPassword('short')).toBe(false);
      });
    });
  });

  describe('cart calculation helpers', () => {
    describe('calculateCartTotal', () => {
      it('calculates total correctly', () => {
        const items = [
          { price: 1000, quantity: 2 },
          { price: 500, quantity: 3 },
        ];
        expect(calculateCartTotal(items)).toBe(3500);
      });

      it('returns 0 for empty cart', () => {
        expect(calculateCartTotal([])).toBe(0);
      });
    });

    describe('calculateTax', () => {
      it('calculates tax correctly with 10% rate', () => {
        expect(calculateTax(1000)).toBe(100);
        expect(calculateTax(500)).toBe(50);
      });
    });

    describe('calculateShipping', () => {
      it('returns 0 for orders above 5000 yen', () => {
        expect(calculateShipping(5000)).toBe(0);
        expect(calculateShipping(10000)).toBe(0);
      });

      it('returns 500 for orders below 5000 yen', () => {
        expect(calculateShipping(3000)).toBe(500);
        expect(calculateShipping(0)).toBe(500);
      });
    });
  });

  describe('getErrorMessage', () => {
    it('handles string errors', () => {
      expect(getErrorMessage('Error message')).toBe('Error message');
    });

    it('handles axios error with response', () => {
      const error = {
        response: {
          data: {
            message: 'Server error',
          },
        },
      };
      expect(getErrorMessage(error)).toBe('Server error');
    });

    it('handles validation errors', () => {
      const error = {
        response: {
          data: {
            errors: {
              email: ['Email is required'],
            },
          },
        },
      };
      expect(getErrorMessage(error)).toBe('Email is required');
    });

    it('handles network errors', () => {
      const error = {
        message: 'Network Error',
      };
      expect(getErrorMessage(error)).toContain('ネットワークエラー');
    });

    it('handles HTTP status errors', () => {
      const error = {
        response: {
          status: 404,
        },
      };
      expect(getErrorMessage(error)).toContain('見つかりません');
    });

    it('returns generic message for unknown errors', () => {
      const error = {};
      expect(getErrorMessage(error)).toBe('予期しないエラーが発生しました');
    });
  });
});
