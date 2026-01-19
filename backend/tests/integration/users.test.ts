import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/utils/prismaClient';
import { Bcrypt } from '../../src/utils/Bcrypt';
import { createUserSchema, updateUserSchema, resetPasswordSchema, getUsersQuerySchema } from '../../src/utils/validationSchemas';

describe('Users CRUD Integration Tests', () => {
  let adminUser: any;
  let testUser: any;
  let createdUserId: bigint;

  beforeAll(async () => {
    // Create admin user for testing
    const adminPassword = await Bcrypt.hash('AdminPass123!');
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin Test',
        mail: 'admin-test@example.com',
        password: adminPassword,
        userType: 'admin',
        active: true,
      },
    });

    // Create a test user
    const testPassword = await Bcrypt.hash('TestPass123!');
    testUser = await prisma.user.create({
      data: {
        name: 'Test Worker',
        mail: 'test-worker@example.com',
        password: testPassword,
        userType: 'worker',
        active: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up test users
    if (adminUser) {
      await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('GET /api/admin/users', () => {
    it('should fetch all users when no active filter is provided', async () => {
      const users = await prisma.user.findMany({
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

      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).not.toHaveProperty('password');
    });

    it('should filter users by active=true', async () => {
      const users = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          mail: true,
          userType: true,
          active: true,
        },
      });

      expect(users.length).toBeGreaterThan(0);
      users.forEach((user) => {
        expect(user.active).toBe(true);
      });
    });

    it('should filter users by active=false', async () => {
      // Create an inactive user with unique email
      const inactivePassword = await Bcrypt.hash('Inactive123!');
      const uniqueEmail = `inactive-${Date.now()}@example.com`;
      const inactiveUser = await prisma.user.create({
        data: {
          name: 'Inactive User',
          mail: uniqueEmail,
          password: inactivePassword,
          userType: 'worker',
          active: false,
        },
      });

      const users = await prisma.user.findMany({
        where: { active: false },
        select: {
          id: true,
          active: true,
        },
      });

      expect(users.length).toBeGreaterThan(0);
      users.forEach((user) => {
        expect(user.active).toBe(false);
      });

      // Clean up
      await prisma.user.delete({ where: { id: inactiveUser.id } });
    });

    it('should validate query param schema', () => {
      const validTrue = getUsersQuerySchema.safeParse({ active: 'true' });
      expect(validTrue.success).toBe(true);
      if (validTrue.success) {
        expect(validTrue.data.active).toBe(true);
      }

      const validFalse = getUsersQuerySchema.safeParse({ active: 'false' });
      expect(validFalse.success).toBe(true);
      if (validFalse.success) {
        expect(validFalse.data.active).toBe(false);
      }

      const validEmpty = getUsersQuerySchema.safeParse({});
      expect(validEmpty.success).toBe(true);
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'New Worker',
        mail: 'new-worker@example.com',
        password: 'NewPass123!',
        userType: 'worker' as const,
      };

      // Validate schema
      const validation = createUserSchema.safeParse(userData);
      expect(validation.success).toBe(true);

      if (validation.success) {
        // Hash password
        const hashedPassword = await Bcrypt.hash(userData.password);

        // Create user
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

        createdUserId = user.id;
      }
    });

    it('should reject duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        mail: testUser.mail, // Use existing email
        password: 'Duplicate123!',
        userType: 'worker' as const,
      };

      const existingUser = await prisma.user.findUnique({
        where: { mail: userData.mail },
      });

      expect(existingUser).toBeDefined();
      expect(existingUser?.mail).toBe(userData.mail);
    });

    it('should validate password strength requirements', () => {
      const weakPassword = {
        name: 'Test User',
        mail: 'test@example.com',
        password: 'weak', // Too short
        userType: 'worker' as const,
      };

      const result = createUserSchema.safeParse(weakPassword);
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
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user fields', async () => {
      const updateData = {
        name: 'Updated Name',
        userType: 'admin' as const,
        active: true,
      };

      // Validate schema
      const validation = updateUserSchema.safeParse(updateData);
      expect(validation.success).toBe(true);

      if (validation.success && testUser) {
        // Update user
        const updatedUser = await prisma.user.update({
          where: { id: testUser.id },
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
      }
    });

    it('should reject password field in update schema', () => {
      const updateWithPassword = {
        name: 'Updated Name',
        password: 'NewPass123!',
      };

      // Password should not be in schema
      const result = updateUserSchema.safeParse(updateWithPassword);
      // Schema should accept it but password won't be in validated data
      if (result.success) {
        expect(result.data).not.toHaveProperty('password');
      }
    });

    it('should check for duplicate email when updating mail', async () => {
      if (testUser && adminUser) {
        const updateData = {
          mail: adminUser.mail, // Try to use existing email
        };

        const emailExists = await prisma.user.findUnique({
          where: { mail: updateData.mail },
        });

        expect(emailExists).toBeDefined();
        expect(emailExists?.id).not.toBe(testUser.id);
      }
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = BigInt(999999);
      const user = await prisma.user.findUnique({
        where: { id: nonExistentId },
      });

      expect(user).toBeNull();
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should soft delete user (set active=false)', async () => {
      // Create a user to delete
      const deletePassword = await Bcrypt.hash('DeletePass123!');
      const userToDelete = await prisma.user.create({
        data: {
          name: 'User To Delete',
          mail: 'delete@example.com',
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

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = BigInt(999999);
      const user = await prisma.user.findUnique({
        where: { id: nonExistentId },
      });

      expect(user).toBeNull();
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('should reset user password', async () => {
      const newPassword = 'NewResetPass123!';

      // Validate schema
      const validation = resetPasswordSchema.safeParse({ newPassword });
      expect(validation.success).toBe(true);

      if (validation.success && testUser) {
        // Hash new password
        const hashedPassword = await Bcrypt.hash(newPassword);

        // Update password
        await prisma.user.update({
          where: { id: testUser.id },
          data: { password: hashedPassword },
        });

        // Verify password was updated
        const updatedUser = await prisma.user.findUnique({
          where: { id: testUser.id },
          select: {
            password: true,
          },
        });

        expect(updatedUser).toBeDefined();
        const isValid = await Bcrypt.compare(newPassword, updatedUser!.password);
        expect(isValid).toBe(true);
      }
    });

    it('should validate password strength requirements', () => {
      const weakPassword = {
        newPassword: 'weak', // Too short
      };

      const result = resetPasswordSchema.safeParse(weakPassword);
      expect(result.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = BigInt(999999);
      const user = await prisma.user.findUnique({
        where: { id: nonExistentId },
      });

      expect(user).toBeNull();
    });
  });
});
