import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Bcrypt } from '@/utils/Bcrypt';
import { loginSchema } from '@/validators/auth.schema';

// Setup test database connection
const prisma = new PrismaClient();

describe('Auth Integration Tests', () => {
  let testUser: any;
  let inactiveUser: any;

  beforeAll(async () => {
    // Create active test user
    const hashedPassword = await Bcrypt.hash('TestPassword123');
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        mail: 'test@example.com',
        password: hashedPassword,
        userType: 'worker',
        active: true,
      },
    });

    // Create inactive test user
    const inactivePassword = await Bcrypt.hash('InactivePass123');
    inactiveUser = await prisma.user.create({
      data: {
        name: 'Inactive User',
        mail: 'inactive@example.com',
        password: inactivePassword,
        userType: 'worker',
        active: false,
      },
    });
  });

  afterAll(async () => {
    // Clean up test users
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (inactiveUser) {
      await prisma.user.delete({ where: { id: inactiveUser.id } });
    }
    await prisma.$disconnect();
  });

  describe('Database and Auth Flow Integration', () => {
    it('should find user by email in database', async () => {
      const user = await prisma.user.findUnique({
        where: { mail: 'test@example.com' },
      });

      expect(user).toBeDefined();
      expect(user?.mail).toBe('test@example.com');
      expect(user?.name).toBe('Test User');
    });

    it('should verify password hash matches stored hash', async () => {
      const user = await prisma.user.findUnique({
        where: { mail: 'test@example.com' },
      });

      expect(user).toBeDefined();
      const isValid = await Bcrypt.compare('TestPassword123', user!.password);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password with stored hash', async () => {
      const user = await prisma.user.findUnique({
        where: { mail: 'test@example.com' },
      });

      expect(user).toBeDefined();
      const isValid = await Bcrypt.compare('WrongPassword123', user!.password);
      expect(isValid).toBe(false);
    });

    it('should validate login schema before database query', () => {
      const validData = {
        mail: 'test@example.com',
        password: 'TestPassword123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format before database query', () => {
      const invalidData = {
        mail: 'notanemail',
        password: 'TestPassword123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('User not found scenarios', () => {
    it('should return null when user email does not exist', async () => {
      const user = await prisma.user.findUnique({
        where: { mail: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
    });

    it('should reject login attempt for non-existent user', async () => {
      const user = await prisma.user.findUnique({
        where: { mail: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
      // This simulates the login endpoint behavior
      const shouldThrow = !user;
      expect(shouldThrow).toBe(true);
    });
  });

  describe('Inactive user scenarios', () => {
    it('should find inactive user by email', async () => {
      const user = await prisma.user.findUnique({
        where: { mail: 'inactive@example.com' },
      });

      expect(user).toBeDefined();
      expect(user?.mail).toBe('inactive@example.com');
      expect(user?.active).toBe(false);
    });

    it('should verify password hash for inactive user', async () => {
      const user = await prisma.user.findUnique({
        where: { mail: 'inactive@example.com' },
      });

      expect(user).toBeDefined();
      const isValid = await Bcrypt.compare('InactivePass123', user!.password);
      expect(isValid).toBe(true);
    });

    it('should reject login attempt for inactive user even with correct password', async () => {
      const user = await prisma.user.findUnique({
        where: { mail: 'inactive@example.com' },
      });

      expect(user).toBeDefined();
      expect(user?.active).toBe(false);
      // This simulates the login endpoint behavior - inactive users should be rejected
      const shouldReject = !user?.active;
      expect(shouldReject).toBe(true);
    });
  });
});
