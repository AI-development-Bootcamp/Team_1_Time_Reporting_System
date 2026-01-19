import { describe, it, expect } from 'vitest';
import { loginSchema, createUserSchema, updateUserSchema, resetPasswordSchema } from './validationSchemas';

describe('loginSchema', () => {
  describe('valid inputs', () => {
    it('should validate correct email and password', () => {
      const result = loginSchema.safeParse({
        mail: 'user@example.com',
        password: 'anypassword',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mail).toBe('user@example.com');
        expect(result.data.password).toBe('anypassword');
      }
    });

    it('should accept password with minimum length of 1', () => {
      const result = loginSchema.safeParse({
        mail: 'user@example.com',
        password: 'a',
      });

      expect(result.success).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const result = loginSchema.safeParse({
        mail: 'user@mail.example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('should accept email with plus sign', () => {
      const result = loginSchema.safeParse({
        mail: 'user+tag@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('should accept email with numbers', () => {
      const result = loginSchema.safeParse({
        mail: 'user123@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        mail: 'notanemail',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('mail');
        expect(result.error.issues[0].message).toContain('email');
      }
    });

    it('should reject empty email', () => {
      const result = loginSchema.safeParse({
        mail: '',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        mail: 'user@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({
        mail: 'user@example.com',
      });

      expect(result.success).toBe(false);
    });

    it('should reject email without @ symbol', () => {
      const result = loginSchema.safeParse({
        mail: 'userexample.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = loginSchema.safeParse({
        mail: 'user@',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject email without local part', () => {
      const result = loginSchema.safeParse({
        mail: '@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject null email', () => {
      const result = loginSchema.safeParse({
        // @ts-ignore - testing invalid input
        mail: null,
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject null password', () => {
      const result = loginSchema.safeParse({
        mail: 'user@example.com',
        // @ts-ignore - testing invalid input
        password: null,
      });

      expect(result.success).toBe(false);
    });

    it('should reject undefined email', () => {
      const result = loginSchema.safeParse({
        mail: undefined,
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject undefined password', () => {
      const result = loginSchema.safeParse({
        mail: 'user@example.com',
        password: undefined,
      });

      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only email', () => {
      const result = loginSchema.safeParse({
        mail: '   ',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only password', () => {
      const result = loginSchema.safeParse({
        mail: 'user@example.com',
        password: '   ',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('createUserSchema', () => {
  describe('valid inputs', () => {
    it('should validate correct user data with strong password', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'StrongPass123!',
        userType: 'worker',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.mail).toBe('john@example.com');
        expect(result.data.password).toBe('StrongPass123!');
        expect(result.data.userType).toBe('worker');
      }
    });

    it('should accept admin userType', () => {
      const result = createUserSchema.safeParse({
        name: 'Admin User',
        mail: 'admin@example.com',
        password: 'AdminPass123!',
        userType: 'admin',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('password validation', () => {
    it('should reject password shorter than 8 characters', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'Short1!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(issue => issue.path.includes('password'));
        expect(passwordError).toBeDefined();
      }
    });

    it('should reject password without lowercase letter', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'UPPERCASE123!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase letter', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'lowercase123!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'NoSpecial123',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without numbers', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'NoNumbers!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should accept password with exactly 8 characters', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'Pass123!',
        userType: 'worker',
      });

      expect(result.success).toBe(true);
    });

    it('should accept password with all required character types', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'Aa1!Bb2@Cc3#',
        userType: 'worker',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid email format', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'notanemail',
        password: 'StrongPass123!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = createUserSchema.safeParse({
        name: '',
        mail: 'john@example.com',
        password: 'StrongPass123!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid userType', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'StrongPass123!',
        userType: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should reject null name', () => {
      const result = createUserSchema.safeParse({
        // @ts-ignore - testing invalid input
        name: null,
        mail: 'john@example.com',
        password: 'StrongPass123!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should reject undefined name', () => {
      const result = createUserSchema.safeParse({
        name: undefined,
        mail: 'john@example.com',
        password: 'StrongPass123!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only name', () => {
      const result = createUserSchema.safeParse({
        name: '   ',
        mail: 'john@example.com',
        password: 'StrongPass123!',
        userType: 'worker',
      });

      expect(result.success).toBe(false);
    });

    it('should reject null userType', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        mail: 'john@example.com',
        password: 'StrongPass123!',
        // @ts-ignore - testing invalid input
        userType: null,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('updateUserSchema', () => {
  describe('valid inputs', () => {
    it('should accept update with name only', () => {
      const result = updateUserSchema.safeParse({
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
    });

    it('should accept update with mail only', () => {
      const result = updateUserSchema.safeParse({
        mail: 'updated@example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should accept update with userType only', () => {
      const result = updateUserSchema.safeParse({
        userType: 'admin',
      });

      expect(result.success).toBe(true);
    });

    it('should accept update with active only', () => {
      const result = updateUserSchema.safeParse({
        active: false,
      });

      expect(result.success).toBe(true);
    });

    it('should accept update with multiple fields', () => {
      const result = updateUserSchema.safeParse({
        name: 'Updated Name',
        userType: 'admin',
        active: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty update object', () => {
      const result = updateUserSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('should reject password field', () => {
      const result = updateUserSchema.safeParse({
        name: 'Updated Name',
        password: 'NewPass123!',
      });

      // Password should not be in validated data even if provided
      if (result.success) {
        expect(result.data).not.toHaveProperty('password');
      }
    });

    it('should reject empty name', () => {
      const result = updateUserSchema.safeParse({
        name: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only name', () => {
      const result = updateUserSchema.safeParse({
        name: '   ',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = updateUserSchema.safeParse({
        mail: 'notanemail',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid userType', () => {
      const result = updateUserSchema.safeParse({
        userType: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('resetPasswordSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid password meeting all requirements', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'NewPass123!',
      });

      expect(result.success).toBe(true);
    });

    it('should accept password with exactly 8 characters', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'Pass123!',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject password shorter than 8 characters', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'Short1!',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase letter', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'UPPERCASE123!',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase letter', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'lowercase123!',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'NoNumbers!',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: 'NoSpecial123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = resetPasswordSchema.safeParse({
        newPassword: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing newPassword field', () => {
      const result = resetPasswordSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });
});
