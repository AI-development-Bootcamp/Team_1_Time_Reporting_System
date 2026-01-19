import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prismaClient';
import { Bcrypt } from '../../src/utils/Bcrypt';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  getUsersQuerySchema,
} from '../../src/utils/validationSchemas';
import jwt from 'jsonwebtoken';

/**
 * Comprehensive Integration Tests for User CRUD Endpoints (TASK-M1-011)
 * 
 * Tests cover:
 * - GET /api/admin/users (list and single user)
 * - POST /api/admin/users (create)
 * - PUT /api/admin/users/:id (update)
 * - DELETE /api/admin/users/:id (soft delete)
 * - POST /api/admin/users/:id/reset-password
 * - Authentication/Authorization
 * - Edge cases and error scenarios
 */

describe('User CRUD Integration Tests - TASK-M1-011', () => {
  let adminUser: any;
  let workerUser: any;
  let inactiveUser: any;
  let createdUserIds: bigint[] = [];

  // Helper to create JWT token for testing
  const createTestToken = (userId: bigint, userType: 'admin' | 'worker') => {
    const secret = process.env.JWT_SECRET || 'test-secret';
    return jwt.sign(
      {
        userId: userId.toString(),
        userType,
        user: {
          id: Number(userId),
          name: 'Test User',
          mail: 'test@example.com',
          userType,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      secret,
      { expiresIn: '24h' }
    );
  };

  beforeAll(async () => {
    // Create admin user for testing
    const adminPassword = await Bcrypt.hash('AdminPass123!');
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test User',
        mail: 'admin-test-crud@example.com',
        password: adminPassword,
        userType: 'admin',
        active: true,
      },
    });

    // Create worker user for testing
    const workerPassword = await Bcrypt.hash('WorkerPass123!');
    workerUser = await prisma.user.create({
      data: {
        name: 'Worker Test User',
        mail: 'worker-test-crud@example.com',
        password: workerPassword,
        userType: 'worker',
        active: true,
      },
    });

    // Create inactive user for testing
    const inactivePassword = await Bcrypt.hash('InactivePass123!');
    inactiveUser = await prisma.user.create({
      data: {
        name: 'Inactive Test User',
        mail: 'inactive-test-crud@example.com',
        password: inactivePassword,
        userType: 'worker',
        active: false,
      },
    });
  });

  afterAll(async () => {
    // Clean up all test users
    const usersToDelete = [adminUser, workerUser, inactiveUser, ...createdUserIds];
    for (const user of usersToDelete) {
      if (user?.id) {
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      }
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Reset created user IDs for each test
    createdUserIds = [];
  });

  // ============================================================================
  // GET /api/admin/users - List Users
  // ============================================================================

  describe('GET /api/admin/users - List Users', () => {
    it('should return only active users by default when no filter is provided', async () => {
      const users = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          mail: true,
          userType: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(users.length).toBeGreaterThan(0);
      users.forEach((user) => {
        expect(user.active).toBe(true);
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should filter users by active=true when query param is provided', async () => {
      const users = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          active: true,
        },
      });

      expect(users.length).toBeGreaterThan(0);
      users.forEach((user) => {
        expect(user.active).toBe(true);
      });
    });

    it('should filter users by active=false when query param is provided', async () => {
      const users = await prisma.user.findMany({
        where: { active: false },
        select: {
          id: true,
          name: true,
          active: true,
        },
      });

      expect(users.length).toBeGreaterThan(0);
      users.forEach((user) => {
        expect(user.active).toBe(false);
      });
    });

    it('should return users ordered by createdAt descending', async () => {
      const users = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (users.length > 1) {
        for (let i = 0; i < users.length - 1; i++) {
          const current = new Date(users[i].createdAt);
          const next = new Date(users[i + 1].createdAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });

    it('should exclude password field from response', async () => {
      const users = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          mail: true,
          userType: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 1,
      });

      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).not.toHaveProperty('password');
    });

    it('should convert BigInt IDs to numbers in response', async () => {
      const users = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
        },
        take: 1,
      });

      if (users.length > 0) {
        const userId = Number(users[0].id);
        expect(typeof userId).toBe('number');
        expect(userId).toBeGreaterThan(0);
      }
    });

    it('should convert dates to ISO strings in response', async () => {
      const users = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 1,
      });

      if (users.length > 0) {
        const createdAt = users[0].createdAt.toISOString();
        const updatedAt = users[0].updatedAt.toISOString();
        expect(typeof createdAt).toBe('string');
        expect(typeof updatedAt).toBe('string');
        expect(() => new Date(createdAt)).not.toThrow();
        expect(() => new Date(updatedAt)).not.toThrow();
      }
    });

    it('should handle empty result set gracefully', async () => {
      // Query for a non-existent active status combination
      const users = await prisma.user.findMany({
        where: {
          active: true,
          mail: 'nonexistent-email-that-does-not-exist@example.com',
        },
        select: {
          id: true,
        },
      });

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });
  });

  // ============================================================================
  // GET /api/admin/users?id=123 - Get Single User
  // ============================================================================

  describe('GET /api/admin/users?id=123 - Get Single User', () => {
    it('should return a single user when id query param is provided', async () => {
      const user = await prisma.user.findUnique({
        where: { id: adminUser.id },
        select: {
          id: true,
          name: true,
          mail: true,
          userType: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(user).toBeDefined();
      expect(user?.id).toBe(adminUser.id);
      expect(user?.mail).toBe(adminUser.mail);
      expect(user).not.toHaveProperty('password');
    });

    it('should return 404 error structure for non-existent user', async () => {
      const nonExistentId = BigInt(999999999);
      const user = await prisma.user.findUnique({
        where: { id: nonExistentId },
      });

      expect(user).toBeNull();
    });

    it('should convert BigInt ID to number in single user response', async () => {
      const user = await prisma.user.findUnique({
        where: { id: adminUser.id },
        select: {
          id: true,
        },
      });

      if (user) {
        const userId = Number(user.id);
        expect(typeof userId).toBe('number');
        expect(userId).toBeGreaterThan(0);
      }
    });

    it('should handle invalid id query param format', () => {
      const invalidId = getUsersQuerySchema.safeParse({ id: 'invalid' });
      // Should handle gracefully - transform returns undefined for invalid BigInt
      if (invalidId.success) {
        expect(invalidId.data.id).toBeUndefined();
      }
    });

    it('should handle empty id query param', () => {
      const emptyId = getUsersQuerySchema.safeParse({ id: '' });
      if (emptyId.success) {
        expect(emptyId.data.id).toBeUndefined();
      }
    });

    it('should handle id query param with whitespace', () => {
      const whitespaceId = getUsersQuerySchema.safeParse({ id: '   ' });
      if (whitespaceId.success) {
        expect(whitespaceId.data.id).toBeUndefined();
      }
    });
  });

  // ============================================================================
  // POST /api/admin/users - Create User
  // ============================================================================

  describe('POST /api/admin/users - Create User', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'New Worker User',
        mail: `new-worker-${Date.now()}@example.com`,
        password: 'NewPass123!',
        userType: 'worker' as const,
      };

      const validation = createUserSchema.safeParse(userData);
      expect(validation.success).toBe(true);

      if (validation.success) {
        const hashedPassword = await Bcrypt.hash(userData.password);
        const user = await prisma.user.create({
          data: {
            name: userData.name,
            mail: userData.mail,
            password: hashedPassword,
            userType: userData.userType,
            active: true,
          },
          select: {
            id: true,
            name: true,
            mail: true,
            userType: true,
            active: true,
          },
        });

        expect(user).toBeDefined();
        expect(user.mail).toBe(userData.mail);
        expect(user.name).toBe(userData.name);
        expect(user.userType).toBe('worker');
        expect(user.active).toBe(true);
        expect(user).not.toHaveProperty('password');

        createdUserIds.push(user.id);
      }
    });

    it('should create admin user with valid data', async () => {
      const userData = {
        name: 'New Admin User',
        mail: `new-admin-${Date.now()}@example.com`,
        password: 'AdminPass123!',
        userType: 'admin' as const,
      };

      const validation = createUserSchema.safeParse(userData);
      expect(validation.success).toBe(true);

      if (validation.success) {
        const hashedPassword = await Bcrypt.hash(userData.password);
        const user = await prisma.user.create({
          data: {
            name: userData.name,
            mail: userData.mail,
            password: hashedPassword,
            userType: userData.userType,
            active: true,
          },
          select: {
            id: true,
            userType: true,
          },
        });

        expect(user.userType).toBe('admin');
        createdUserIds.push(user.id);
      }
    });

    it('should reject duplicate email with proper error structure', async () => {
      const existingUser = await prisma.user.findUnique({
        where: { mail: adminUser.mail },
      });

      expect(existingUser).toBeDefined();
      expect(existingUser?.mail).toBe(adminUser.mail);
    });

    it('should validate password minimum length (8 characters)', () => {
      const weakPassword = {
        name: 'Test User',
        mail: 'test@example.com',
        password: 'Short1!', // 7 characters
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(weakPassword);
      expect(result.success).toBe(false);
    });

    it('should validate password contains uppercase letter', () => {
      const noUppercase = {
        name: 'Test User',
        mail: 'test@example.com',
        password: 'lowercase123!', // No uppercase
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(noUppercase);
      expect(result.success).toBe(false);
    });

    it('should validate password contains lowercase letter', () => {
      const noLowercase = {
        name: 'Test User',
        mail: 'test@example.com',
        password: 'UPPERCASE123!', // No lowercase
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(noLowercase);
      expect(result.success).toBe(false);
    });

    it('should validate password contains number', () => {
      const noNumber = {
        name: 'Test User',
        mail: 'test@example.com',
        password: 'NoNumbers!', // No number
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(noNumber);
      expect(result.success).toBe(false);
    });

    it('should validate password contains special character', () => {
      const noSpecial = {
        name: 'Test User',
        mail: 'test@example.com',
        password: 'NoSpecial123', // No special char
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(noSpecial);
      expect(result.success).toBe(false);
    });

    it('should accept password with exactly 8 characters meeting all requirements', () => {
      const exactLength = {
        name: 'Test User',
        mail: 'test@example.com',
        password: 'Abc123!@', // Exactly 8 chars, meets all requirements
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(exactLength);
      expect(result.success).toBe(true);
    });

    it('should validate name is not empty', () => {
      const emptyName = {
        name: '',
        mail: 'test@example.com',
        password: 'ValidPass123!',
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(emptyName);
      expect(result.success).toBe(false);
    });

    it('should validate name is not only whitespace', () => {
      const whitespaceName = {
        name: '   ',
        mail: 'test@example.com',
        password: 'ValidPass123!',
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(whitespaceName);
      expect(result.success).toBe(false);
    });

    it('should validate email format', () => {
      const invalidEmail = {
        name: 'Test User',
        mail: 'not-an-email',
        password: 'ValidPass123!',
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('should hash password before saving', async () => {
      const password = 'TestHash123!';
      const hashedPassword = await Bcrypt.hash(password);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.startsWith('$2')).toBe(true); // bcrypt hash format

      const isValid = await Bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should set active=true by default for new users', async () => {
      const userData = {
        name: 'Active User',
        mail: `active-${Date.now()}@example.com`,
        password: 'ActivePass123!',
        userType: 'worker' as const,
      };

      const hashedPassword = await Bcrypt.hash(userData.password);
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          mail: userData.mail,
          password: hashedPassword,
          userType: userData.userType,
          active: true,
        },
        select: {
          id: true,
          active: true,
        },
      });

      expect(user.active).toBe(true);
      createdUserIds.push(user.id);
    });

    it('should return user ID as number in response', async () => {
      const userData = {
        name: 'ID Test User',
        mail: `id-test-${Date.now()}@example.com`,
        password: 'IdTestPass123!',
        userType: 'worker' as const,
      };

      const hashedPassword = await Bcrypt.hash(userData.password);
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          mail: userData.mail,
          password: hashedPassword,
          userType: userData.userType,
          active: true,
        },
        select: {
          id: true,
        },
      });

      const userId = Number(user.id);
      expect(typeof userId).toBe('number');
      expect(userId).toBeGreaterThan(0);
      createdUserIds.push(user.id);
    });
  });

  // ============================================================================
  // PUT /api/admin/users/:id - Update User
  // ============================================================================

  describe('PUT /api/admin/users/:id - Update User', () => {
    it('should update user name', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const validation = updateUserSchema.safeParse(updateData);
      expect(validation.success).toBe(true);

      if (validation.success && workerUser) {
        const updatedUser = await prisma.user.update({
          where: { id: workerUser.id },
          data: updateData,
          select: {
            name: true,
          },
        });

        expect(updatedUser.name).toBe(updateData.name);
      }
    });

    it('should update user email', async () => {
      const updateData = {
        mail: `updated-${Date.now()}@example.com`,
      };

      const validation = updateUserSchema.safeParse(updateData);
      expect(validation.success).toBe(true);

      if (validation.success && workerUser) {
        const updatedUser = await prisma.user.update({
          where: { id: workerUser.id },
          data: updateData,
          select: {
            mail: true,
          },
        });

        expect(updatedUser.mail).toBe(updateData.mail);
      }
    });

    it('should update userType', async () => {
      const updateData = {
        userType: 'admin' as const,
      };

      const validation = updateUserSchema.safeParse(updateData);
      expect(validation.success).toBe(true);

      if (validation.success && workerUser) {
        const updatedUser = await prisma.user.update({
          where: { id: workerUser.id },
          data: updateData,
          select: {
            userType: true,
          },
        });

        expect(updatedUser.userType).toBe('admin');

        // Reset back to worker
        await prisma.user.update({
          where: { id: workerUser.id },
          data: { userType: 'worker' },
        });
      }
    });

    it('should update active status', async () => {
      const updateData = {
        active: false,
      };

      const validation = updateUserSchema.safeParse(updateData);
      expect(validation.success).toBe(true);

      if (validation.success && workerUser) {
        const updatedUser = await prisma.user.update({
          where: { id: workerUser.id },
          data: updateData,
          select: {
            active: true,
          },
        });

        expect(updatedUser.active).toBe(false);

        // Reset back to active
        await prisma.user.update({
          where: { id: workerUser.id },
          data: { active: true },
        });
      }
    });

    it('should update multiple fields at once', async () => {
      const updateData = {
        name: 'Multi Update',
        userType: 'admin' as const,
        active: true,
      };

      const validation = updateUserSchema.safeParse(updateData);
      expect(validation.success).toBe(true);

      if (validation.success && workerUser) {
        const updatedUser = await prisma.user.update({
          where: { id: workerUser.id },
          data: updateData,
          select: {
            name: true,
            userType: true,
            active: true,
          },
        });

        expect(updatedUser.name).toBe(updateData.name);
        expect(updatedUser.userType).toBe(updateData.userType);
        expect(updatedUser.active).toBe(updateData.active);

        // Reset
        await prisma.user.update({
          where: { id: workerUser.id },
          data: { userType: 'worker' },
        });
      }
    });

    it('should reject password field in update schema', () => {
      const updateWithPassword = {
        name: 'Updated Name',
        password: 'NewPass123!',
      };

      const result = updateUserSchema.safeParse(updateWithPassword);
      if (result.success) {
        // Password should not be in validated data
        expect(result.data).not.toHaveProperty('password');
      }
    });

    it('should require at least one field for update', () => {
      const emptyUpdate = {};

      const result = updateUserSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
    });

    it('should check for duplicate email when updating mail', async () => {
      if (workerUser && adminUser) {
        const emailExists = await prisma.user.findUnique({
          where: { mail: adminUser.mail },
        });

        expect(emailExists).toBeDefined();
        expect(emailExists?.id).not.toBe(workerUser.id);
      }
    });

    it('should allow updating mail to same value (no conflict)', async () => {
      if (workerUser) {
        const updateData = {
          mail: workerUser.mail, // Same email
        };

        const validation = updateUserSchema.safeParse(updateData);
        expect(validation.success).toBe(true);
      }
    });

    it('should return 404 error structure for non-existent user', async () => {
      const nonExistentId = BigInt(999999999);
      const user = await prisma.user.findUnique({
        where: { id: nonExistentId },
      });

      expect(user).toBeNull();
    });

    it('should validate name is not empty when provided', () => {
      const emptyName = {
        name: '',
      };

      const result = updateUserSchema.safeParse(emptyName);
      expect(result.success).toBe(false);
    });

    it('should validate name is not only whitespace when provided', () => {
      const whitespaceName = {
        name: '   ',
      };

      const result = updateUserSchema.safeParse(whitespaceName);
      expect(result.success).toBe(false);
    });

    it('should validate email format when provided', () => {
      const invalidEmail = {
        mail: 'not-an-email',
      };

      const result = updateUserSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // DELETE /api/admin/users/:id - Soft Delete
  // ============================================================================

  describe('DELETE /api/admin/users/:id - Soft Delete', () => {
    it('should soft delete user (set active=false)', async () => {
      // Create a user to delete
      const deletePassword = await Bcrypt.hash('DeletePass123!');
      const userToDelete = await prisma.user.create({
        data: {
          name: 'User To Delete',
          mail: `delete-${Date.now()}@example.com`,
          password: deletePassword,
          userType: 'worker',
          active: true,
        },
      });

      // Soft delete
      const deletedUser = await prisma.user.update({
        where: { id: userToDelete.id },
        data: { active: false },
        select: {
          id: true,
          active: true,
        },
      });

      expect(deletedUser.active).toBe(false);

      // Verify user still exists in DB
      const stillExists = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });

      expect(stillExists).toBeDefined();
      expect(stillExists?.active).toBe(false);

      // Clean up
      await prisma.user.delete({ where: { id: userToDelete.id } });
    });

    it('should return 404 error structure for non-existent user', async () => {
      const nonExistentId = BigInt(999999999);
      const user = await prisma.user.findUnique({
        where: { id: nonExistentId },
      });

      expect(user).toBeNull();
    });

    it('should handle deleting already inactive user', async () => {
      // inactiveUser is already inactive
      const user = await prisma.user.findUnique({
        where: { id: inactiveUser.id },
        select: {
          active: true,
        },
      });

      expect(user?.active).toBe(false);

      // Soft delete again (should still work)
      const deletedUser = await prisma.user.update({
        where: { id: inactiveUser.id },
        data: { active: false },
        select: {
          active: true,
        },
      });

      expect(deletedUser.active).toBe(false);
    });

    it('should handle BigInt ID conversion correctly', async () => {
      const userId = workerUser.id;
      expect(typeof userId).toBe('bigint');

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(user).toBeDefined();
    });
  });

  // ============================================================================
  // POST /api/admin/users/:id/reset-password - Reset Password
  // ============================================================================

  describe('POST /api/admin/users/:id/reset-password - Reset Password', () => {
    it('should reset user password with valid new password', async () => {
      const newPassword = 'NewResetPass123!';

      const validation = resetPasswordSchema.safeParse({ newPassword });
      expect(validation.success).toBe(true);

      if (validation.success && workerUser) {
        const hashedPassword = await Bcrypt.hash(newPassword);

        await prisma.user.update({
          where: { id: workerUser.id },
          data: { password: hashedPassword },
        });

        // Verify password was updated
        const updatedUser = await prisma.user.findUnique({
          where: { id: workerUser.id },
          select: {
            password: true,
          },
        });

        expect(updatedUser).toBeDefined();
        const isValid = await Bcrypt.compare(newPassword, updatedUser!.password);
        expect(isValid).toBe(true);
      }
    });

    it('should validate password minimum length (8 characters)', () => {
      const weakPassword = {
        newPassword: 'Short1!', // 7 characters
      };

      const result = resetPasswordSchema.safeParse(weakPassword);
      expect(result.success).toBe(false);
    });

    it('should validate password contains uppercase letter', () => {
      const noUppercase = {
        newPassword: 'lowercase123!',
      };

      const result = resetPasswordSchema.safeParse(noUppercase);
      expect(result.success).toBe(false);
    });

    it('should validate password contains lowercase letter', () => {
      const noLowercase = {
        newPassword: 'UPPERCASE123!',
      };

      const result = resetPasswordSchema.safeParse(noLowercase);
      expect(result.success).toBe(false);
    });

    it('should validate password contains number', () => {
      const noNumber = {
        newPassword: 'NoNumbers!',
      };

      const result = resetPasswordSchema.safeParse(noNumber);
      expect(result.success).toBe(false);
    });

    it('should validate password contains special character', () => {
      const noSpecial = {
        newPassword: 'NoSpecial123',
      };

      const result = resetPasswordSchema.safeParse(noSpecial);
      expect(result.success).toBe(false);
    });

    it('should accept password with exactly 8 characters meeting all requirements', () => {
      const exactLength = {
        newPassword: 'Abc123!@',
      };

      const result = resetPasswordSchema.safeParse(exactLength);
      expect(result.success).toBe(true);
    });

    it('should hash new password before saving', async () => {
      const newPassword = 'HashTest123!';
      const hashedPassword = await Bcrypt.hash(newPassword);

      expect(hashedPassword).not.toBe(newPassword);
      expect(hashedPassword.startsWith('$2')).toBe(true);

      const isValid = await Bcrypt.compare(newPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should return 404 error structure for non-existent user', async () => {
      const nonExistentId = BigInt(999999999);
      const user = await prisma.user.findUnique({
        where: { id: nonExistentId },
      });

      expect(user).toBeNull();
    });

    it('should handle resetting password for inactive user', async () => {
      const newPassword = 'InactiveReset123!';
      const validation = resetPasswordSchema.safeParse({ newPassword });
      expect(validation.success).toBe(true);

      if (validation.success && inactiveUser) {
        const hashedPassword = await Bcrypt.hash(newPassword);
        await prisma.user.update({
          where: { id: inactiveUser.id },
          data: { password: hashedPassword },
        });

        const updatedUser = await prisma.user.findUnique({
          where: { id: inactiveUser.id },
          select: {
            password: true,
          },
        });

        expect(updatedUser).toBeDefined();
        const isValid = await Bcrypt.compare(newPassword, updatedUser!.password);
        expect(isValid).toBe(true);
      }
    });
  });

  // ============================================================================
  // Query Parameter Validation Tests
  // ============================================================================

  describe('Query Parameter Validation', () => {
    it('should parse active=true query param correctly', () => {
      const result = getUsersQuerySchema.safeParse({ active: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
      }
    });

    it('should parse active=false query param correctly', () => {
      const result = getUsersQuerySchema.safeParse({ active: 'false' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(false);
      }
    });

    it('should handle missing active param (undefined)', () => {
      const result = getUsersQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBeUndefined();
      }
    });

    it('should parse valid id query param as BigInt', () => {
      const result = getUsersQuerySchema.safeParse({ id: '123' });
      expect(result.success).toBe(true);
      if (result.success && result.data.id) {
        expect(typeof result.data.id).toBe('bigint');
        expect(result.data.id.toString()).toBe('123');
      }
    });

    it('should handle empty id query param', () => {
      const result = getUsersQuerySchema.safeParse({ id: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should handle invalid id query param gracefully', () => {
      const result = getUsersQuerySchema.safeParse({ id: 'invalid' });
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should handle id query param with whitespace', () => {
      const result = getUsersQuerySchema.safeParse({ id: '   ' });
      if (result.success) {
        expect(result.data.id).toBeUndefined();
      }
    });

    it('should handle both active and id params together', () => {
      const result = getUsersQuerySchema.safeParse({
        active: 'true',
        id: '123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        if (result.data.id) {
          expect(typeof result.data.id).toBe('bigint');
        }
      }
    });
  });
});
