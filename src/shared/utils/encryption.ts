import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { createLogger } from './logger';

const logger = createLogger('Encryption');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

/**
 * Encryption service for sensitive data (email, phone, tokens)
 * Validates: Requirements 15.1
 */
export class EncryptionService {
  private masterKey: string;

  constructor() {
    this.masterKey = process.env.ENCRYPTION_KEY || this.generateDefaultKey();

    if (!process.env.ENCRYPTION_KEY) {
      logger.warn('ENCRYPTION_KEY not set, using default key (NOT SECURE FOR PRODUCTION)');
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random salt and IV
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);

      // Derive key from master key and salt
      const key = scryptSync(this.masterKey, salt, KEY_LENGTH);

      // Create cipher
      const cipher = createCipheriv(ALGORITHM, key, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: salt + iv + authTag + encrypted
      const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex'),
      ]);

      return combined.toString('base64');
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(ciphertext, 'base64');

      // Extract components
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = combined.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );
      const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

      // Derive key
      const key = scryptSync(this.masterKey, salt, KEY_LENGTH);

      // Create decipher
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data (one-way, for comparison)
   */
  hash(data: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const hash = scryptSync(data, salt, KEY_LENGTH);
    return Buffer.concat([salt, hash]).toString('base64');
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    try {
      const combined = Buffer.from(hashedData, 'base64');
      const salt = combined.subarray(0, SALT_LENGTH);
      const originalHash = combined.subarray(SALT_LENGTH);

      const hash = scryptSync(data, salt, KEY_LENGTH);

      return hash.equals(originalHash);
    } catch (error) {
      logger.error('Hash verification failed', error);
      return false;
    }
  }

  private generateDefaultKey(): string {
    return 'default-key-not-secure-change-in-production-' + randomBytes(16).toString('hex');
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

/**
 * Helper functions for encrypting/decrypting specific fields
 */
export const encryptSensitiveFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const encrypted = { ...obj };

  fields.forEach((field) => {
    if (encrypted[field]) {
      encrypted[field] = encryptionService.encrypt(String(encrypted[field])) as any;
    }
  });

  return encrypted;
};

export const decryptSensitiveFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const decrypted = { ...obj };

  fields.forEach((field) => {
    if (decrypted[field]) {
      try {
        decrypted[field] = encryptionService.decrypt(String(decrypted[field])) as any;
      } catch (error) {
        logger.warn(`Failed to decrypt field: ${String(field)}`);
      }
    }
  });

  return decrypted;
};
