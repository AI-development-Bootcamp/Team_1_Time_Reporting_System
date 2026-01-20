import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../src/middleware/ErrorHandler';
import projectsRouter from '../../src/routes/admin/Projects';
import { prisma } from '../../src/utils/prisma';
const app = express();
app.use(express.json());
app.use('/api/admin/projects', projectsRouter);
app.use(errorHandler);

describe('Projects API Integration Tests', () => {
  let createdProjectIds: bigint[] = [];
  let testClientId: bigint;
  let testManagerId: bigint;

  beforeAll(async () => {
    await prisma.$connect();

    // Use more unique identifiers to avoid conflicts
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create test client
    const testClient = await prisma.client.create({
      data: {
        name: `Integration Test Client ${uniqueId}`,
        description: 'Test client for project integration tests',
      },
    });
    testClientId = testClient.id;

    // Create test user (project manager)
    const testUser = await prisma.user.create({
      data: {
        name: `Test Manager ${uniqueId}`,
        mail: `testmanager-${uniqueId}@test.com`,
        password: 'hashedpassword',
        userType: 'admin',
      },
    });
    testManagerId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data - delete in order: projects first (child), then users/clients (parent)
    // Delete all projects for this manager to ensure no foreign key constraints
    if (testManagerId) {
      await prisma.project.deleteMany({
        where: {
          projectManagerId: testManagerId,
        },
      });
    }
    // Delete user after projects (projects reference user)
    if (testManagerId) {
      await prisma.user.delete({ where: { id: testManagerId } });
    }
    // Delete client after projects (projects reference client)
    if (testClientId) {
      await prisma.client.delete({ where: { id: testClientId } });
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    createdProjectIds = [];
  });

  describe('Full CRUD Workflow', () => {
    it('should create, read, update, and soft delete a project', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/api/admin/projects')
        .send({
          name: `Integration Test Project ${Date.now()}`,
          clientId: Number(testClientId),
          projectManagerId: Number(testManagerId),
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          description: 'Test project for integration testing',
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.id).toBeDefined();
      const projectId = BigInt(createResponse.body.data.id);
      createdProjectIds.push(projectId);

      // Verify in database
      const createdProject = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(createdProject).toBeDefined();
      expect(createdProject?.name).toContain('Integration Test Project');
      expect(createdProject?.active).toBe(true);
      expect(createdProject?.clientId).toEqual(testClientId);

      // READ - Get all projects
      const listResponse = await request(app)
        .get('/api/admin/projects')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      const foundProject = listResponse.body.data.find(
        (p: any) => p.id === Number(projectId)
      );
      expect(foundProject).toBeDefined();

      // READ - Filter by clientId
      const filteredResponse = await request(app)
        .get(`/api/admin/projects?clientId=${Number(testClientId)}`)
        .expect(200);

      expect(filteredResponse.body.success).toBe(true);
      const filteredProject = filteredResponse.body.data.find(
        (p: any) => p.id === Number(projectId)
      );
      expect(filteredProject).toBeDefined();

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/admin/projects/${projectId}`)
        .send({
          name: 'Updated Integration Test Project',
          description: 'Updated description',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Verify update in database
      const updatedProject = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(updatedProject?.name).toBe('Updated Integration Test Project');
      expect(updatedProject?.description).toBe('Updated description');

      // SOFT DELETE
      const deleteResponse = await request(app)
        .delete(`/api/admin/projects/${projectId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify soft delete in database
      const deletedProject = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(deletedProject?.active).toBe(false);
    });

    it('should return 404 when creating project with non-existent client', async () => {
      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'Test Project',
          clientId: 99999,
          projectManagerId: Number(testManagerId),
          startDate: '2026-01-01',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Client not found');
    });

    it('should return 404 when creating project with non-existent manager', async () => {
      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'Test Project',
          clientId: Number(testClientId),
          projectManagerId: 99999,
          startDate: '2026-01-01',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Project manager not found');
    });
  });
});

