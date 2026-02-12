import { validateEmail, validatePhone, validateRequired, ValidationError } from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate Brazilian phone format', () => {
      expect(validatePhone('(11) 98765-4321')).toBe(true);
      expect(validatePhone('11987654321')).toBe(true);
      expect(validatePhone('+55 (11) 98765-4321')).toBe(true);
    });

    it('should reject invalid phone format', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('invalid')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should not throw for valid values', () => {
      expect(() => validateRequired('value', 'field')).not.toThrow();
      expect(() => validateRequired(123, 'field')).not.toThrow();
      expect(() => validateRequired(true, 'field')).not.toThrow();
    });

    it('should throw ValidationError for empty values', () => {
      expect(() => validateRequired('', 'field')).toThrow(ValidationError);
      expect(() => validateRequired(null, 'field')).toThrow(ValidationError);
      expect(() => validateRequired(undefined, 'field')).toThrow(ValidationError);
    });
  });
});
