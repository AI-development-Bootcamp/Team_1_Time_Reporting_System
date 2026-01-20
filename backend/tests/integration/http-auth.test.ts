import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { prisma } from '@/utils/prismaClient';
import { Bcrypt } from '@/utils/Bcrypt';
import jwt from 'jsonwebtoken';

const app = createApp();

describe('HTTP Integration Tests - Auth Endpoints', () => {
  let testUser: any;
  let adminUser: any;
  let inactiveUser: any;
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key';

    // Create test users
    const testPassword = await Bcrypt.hash('TestPass123!');
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        mail: `test-http-${Date.now()}@example.com`,
        password: testPassword,
        userType: 'worker',
        active: true,
      },
    });

    const adminPassword = await Bcrypt.hash('AdminPass123!');
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        mail: `admin-http-${Date.now()}@example.com`,
        password: adminPassword,
        userType: 'admin',
        active: true,
      },
    });

    const inactivePassword = await Bcrypt.hash('InactivePass123!');
    inactiveUser = await prisma.user.create({
      data: {
        name: 'Inactive User',
        mail: `inactive-http-${Date.now()}@example.com`,
        password: inactivePassword,
        userType: 'worker',
        active: false,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    if (testUser) await prisma.user.delete({ where: { id: testUser.id } }).catch(() => { });
    if (adminUser) await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => { });
    if (inactiveUser) await prisma.user.delete({ where: { id: inactiveUser.id } }).catch(() => { });
    await prisma.$disconnect();
    process.env.JWT_SECRET = originalSecret;
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mail: testUser.mail,
          password: 'TestPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('expiresInHours', 24);
      expect(response.body.data).not.toHaveProperty('user');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mail: 'nonexistent@example.com',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mail: testUser.mail,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for inactive user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mail: inactiveUser.mail,
          password: 'InactivePass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mail: 'not-an-email',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mail: testUser.mail,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return token that can be decoded with user data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          mail: testUser.mail,
          password: 'TestPass123!',
        });

      expect(response.status).toBe(200);
      const token = response.body.data.token;

      // Decode token (no secret needed for reading payload)
      const decoded = jwt.decode(token) as any;
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('userType', 'worker');
      expect(decoded).toHaveProperty('user');
      expect(decoded.user).toHaveProperty('id');
      expect(decoded.user).toHaveProperty('name', testUser.name);
      expect(decoded.user).toHaveProperty('mail', testUser.mail);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          mail: testUser.mail,
          password: 'TestPass123!',
        });

      const token = loginResponse.body.data.token;

      // Use token to get user data
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', testUser.name);
      expect(response.body.data).toHaveProperty('mail', testUser.mail);
      expect(response.body.data).toHaveProperty('userType', 'worker');
      expect(response.body.data).toHaveProperty('active', true);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        {
          userId: testUser.id.toString(),
          userType: 'worker',
          user: {
            id: Number(testUser.id),
            name: testUser.name,
            mail: testUser.mail,
            userType: 'worker',
            active: true,
            createdAt: testUser.createdAt.toISOString(),
            updatedAt: testUser.updatedAt.toISOString(),
          },
        },
        'test-secret-key',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for inactive user token', async () => {
      // Create token for inactive user
      const inactiveToken = jwt.sign(
        {
          userId: inactiveUser.id.toString(),
          userType: 'worker',
          user: {
            id: Number(inactiveUser.id),
            name: inactiveUser.name,
            mail: inactiveUser.mail,
            userType: 'worker',
            active: false,
            createdAt: inactiveUser.createdAt.toISOString(),
            updatedAt: inactiveUser.updatedAt.toISOString(),
          },
        },
        'test-secret-key',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${inactiveToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
