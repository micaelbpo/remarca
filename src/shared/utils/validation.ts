export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Brazilian phone format: +55 (XX) XXXXX-XXXX or (XX) XXXXX-XXXX
  const phoneRegex = /^(\+55\s?)?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
};

export const validateDateFormat = (date: string): boolean => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return isoDateRegex.test(date);
};

export const validateFutureDate = (date: string): boolean => {
  const inputDate = new Date(date);
  const now = new Date();
  return inputDate > now;
};

export const validatePositiveNumber = (value: number, fieldName: string): void => {
  if (typeof value !== 'number' || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const validatePayload = <T extends Record<string, unknown>>(
  payload: unknown,
  requiredFields: (keyof T)[]
): void => {
  const typedPayload = payload as Record<string, unknown>;
  for (const field of requiredFields) {
    validateRequired(typedPayload[field], String(field));
  }
};
