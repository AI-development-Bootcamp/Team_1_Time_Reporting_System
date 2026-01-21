import { describe, it, expect } from 'vitest';
import { Bcrypt } from './Bcrypt';

describe('Bcrypt', () => {
  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await Bcrypt.hash(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash starts with $2
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await Bcrypt.hash(password);
      const hash2 = await Bcrypt.hash(password);
      
      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty string', async () => {
      const hash = await Bcrypt.hash('');
      
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should hash very long password', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await Bcrypt.hash(longPassword);
      
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should hash password with special characters', async () => {
      const specialPassword = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await Bcrypt.hash(specialPassword);
      
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should hash password with unicode characters', async () => {
      const unicodePassword = 'Password123!你好مرحبا';
      const hash = await Bcrypt.hash(unicodePassword);
      
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'TestPassword123!';
      const hash = await Bcrypt.hash(password);
      
      const result = await Bcrypt.compare(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await Bcrypt.hash(password);
      
      const result = await Bcrypt.compare(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'TestPassword123!';
      const hash = await Bcrypt.hash(password);
      
      const result = await Bcrypt.compare('', hash);
      expect(result).toBe(false);
    });

    it('should return false for null password', async () => {
      const password = 'TestPassword123!';
      const hash = await Bcrypt.hash(password);
      
      // @ts-expect-error - testing invalid input
      const result = await Bcrypt.compare(null, hash);
      expect(result).toBe(false);
    });

    it('should return false for null hash', async () => {
      const password = 'TestPassword123!';
      
      // @ts-expect-error - testing invalid input
      const result = await Bcrypt.compare(password, null);
      expect(result).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'not-a-valid-hash';
      
      const result = await Bcrypt.compare(password, invalidHash);
      expect(result).toBe(false);
    });

    it('should return false for password with whitespace differences', async () => {
      const password = 'TestPassword123!';
      const hash = await Bcrypt.hash(password);
      
      const result1 = await Bcrypt.compare(' TestPassword123!', hash);
      const result2 = await Bcrypt.compare('TestPassword123! ', hash);
      const result3 = await Bcrypt.compare('TestPassword123!\t', hash);
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });

    it('should return false for case-sensitive password differences', async () => {
      const password = 'TestPassword123!';
      const hash = await Bcrypt.hash(password);
      
      const result1 = await Bcrypt.compare('testpassword123!', hash);
      const result2 = await Bcrypt.compare('TESTPASSWORD123!', hash);
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });
});
