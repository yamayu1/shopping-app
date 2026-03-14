import {
  formatCurrency,
  formatDate,
  formatDateTime,
  truncateText,
  isValidEmail,
  isValidPhone,
  calculateCartTotal,
  calculateTax,
  calculateShipping,
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

  describe('isValidEmail', () => {
    it('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.jp')).toBe(true);
    });

    it('invalidates incorrect emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('validates correct phone numbers', () => {
      expect(isValidPhone('+1-555-1234')).toBe(true);
      expect(isValidPhone('555-1234')).toBe(true);
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
});
