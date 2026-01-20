import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../src/middleware/ErrorHandler';
import tasksRouter from '../../src/routes/admin/Tasks';
import { prisma } from '../../src/utils/prisma';

const app = express();
app.use(express.json());
app.use('/api/admin/tasks', tasksRouter);
app.use(errorHandler);

describe('Tasks API Integration Tests', () => {
  let createdTaskIds: bigint[] = [];
  let testProjectId: bigint;
  let testClientId: bigint;
  let testManagerId: bigint;

  beforeAll(async () => {
    await prisma.$connect();

    // Create test client
    const testClient = await prisma.client.create({
      data: {
        name: `Integration Test Client ${Date.now()}`,
        description: 'Test client for task integration tests',
      },
    });
    testClientId = testClient.id;

    // Create test user (project manager)
    const testUser = await prisma.user.create({
      data: {
        name: `Test Manager ${Date.now()}`,
        mail: `testmanager${Date.now()}@test.com`,
        password: 'hashedpassword',
        userType: 'admin',
      },
    });
    testManagerId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: `Integration Test Project ${Date.now()}`,
        clientId: testClientId,
        projectManagerId: testManagerId,
        startDate: new Date('2026-01-01'),
        reportingType: 'startEnd',
      },
    });
    testProjectId = testProject.id;
  });

  afterAll(async () => {
    // Clean up test data - delete in order: tasks first (child), then projects, then users/clients (parent)
    // Delete all tasks for the test project to ensure no foreign key constraints
    if (testProjectId) {
      await prisma.task.deleteMany({
        where: {
          projectId: testProjectId,
        },
      });
    }
    // Delete project after tasks (tasks reference project)
    if (testProjectId) {
      await prisma.project.delete({ where: { id: testProjectId } });
    }
    // Delete user after project (project references user)
    if (testManagerId) {
      await prisma.user.delete({ where: { id: testManagerId } });
    }
    // Delete client after project (project references client)
    if (testClientId) {
      await prisma.client.delete({ where: { id: testClientId } });
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    createdTaskIds = [];
  });

  describe('Full CRUD Workflow', () => {
    it('should create, read, update, and soft delete a task', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: `Integration Test Task ${Date.now()}`,
          projectId: Number(testProjectId),
          startDate: '2026-01-20',
          endDate: '2026-12-31',
          description: 'Test task for integration testing',
          status: 'open',
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.id).toBeDefined();
      const taskId = BigInt(createResponse.body.data.id);
      createdTaskIds.push(taskId);

      // Verify in database
      const createdTask = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(createdTask).toBeDefined();
      expect(createdTask?.name).toContain('Integration Test Task');
      expect(createdTask?.status).toBe('open');
      expect(createdTask?.projectId).toEqual(testProjectId);

      // READ - Get all tasks (should include our new task)
      const listResponse = await request(app)
        .get('/api/admin/tasks')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      const foundTask = listResponse.body.data.find(
        (t: any) => t.id === createResponse.body.data.id
      );
      expect(foundTask).toBeDefined();
      expect(foundTask.name).toContain('Integration Test Task');

      // READ - Filter by projectId
      const filteredResponse = await request(app)
        .get(`/api/admin/tasks?projectId=${Number(testProjectId)}`)
        .expect(200);

      expect(filteredResponse.body.success).toBe(true);
      const filteredTask = filteredResponse.body.data.find(
        (t: any) => t.id === createResponse.body.data.id
      );
      expect(filteredTask).toBeDefined();

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/admin/tasks/${taskId}`)
        .send({
          name: 'Updated Integration Test Task',
          description: 'Updated description',
          status: 'closed',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Verify update in database
      const updatedTask = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(updatedTask?.name).toBe('Updated Integration Test Task');
      expect(updatedTask?.description).toBe('Updated description');
      expect(updatedTask?.status).toBe('closed');

      // SOFT DELETE (sets status to closed)
      const deleteResponse = await request(app)
        .delete(`/api/admin/tasks/${taskId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify soft delete in database
      const deletedTask = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(deletedTask?.status).toBe('closed');

      // Verify task is hidden from default list (only shows open tasks)
      const listAfterDeleteResponse = await request(app)
        .get('/api/admin/tasks')
        .expect(200);

      const hiddenTask = listAfterDeleteResponse.body.data.find(
        (t: any) => t.id === createResponse.body.data.id
      );
      expect(hiddenTask).toBeUndefined();
    });

    it('should return 404 when creating task with non-existent project', async () => {
      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'Test Task',
          projectId: 99999,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should create task with minimal required fields', async () => {
      const createResponse = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: `Minimal Task ${Date.now()}`,
          projectId: Number(testProjectId),
        })
        .expect(201);

      const taskId = BigInt(createResponse.body.data.id);
      createdTaskIds.push(taskId);

      // Verify defaults in database
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(task?.status).toBe('open');
      expect(task?.startDate).toBeNull();
      expect(task?.endDate).toBeNull();
    });

    it('should update task projectId and verify project exists', async () => {
      // Create a second project
      const secondProject = await prisma.project.create({
        data: {
          name: `Second Test Project ${Date.now()}`,
          clientId: testClientId,
          projectManagerId: testManagerId,
          startDate: new Date('2026-01-01'),
          reportingType: 'startEnd',
        },
      });

      // Create a task
      const createResponse = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: `Task to Move ${Date.now()}`,
          projectId: Number(testProjectId),
        })
        .expect(201);

      const taskId = BigInt(createResponse.body.data.id);
      createdTaskIds.push(taskId);

      // Update task to move to second project
      const updateResponse = await request(app)
        .put(`/api/admin/tasks/${taskId}`)
        .send({
          projectId: Number(secondProject.id),
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Verify in database
      const updatedTask = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(updatedTask?.projectId).toEqual(secondProject.id);

      // Move task back to original project before deleting second project
      await prisma.task.update({
        where: { id: taskId },
        data: { projectId: testProjectId },
      });

      // Clean up second project (now safe since no tasks reference it)
      await prisma.project.delete({ where: { id: secondProject.id } });
    });
  });
});

