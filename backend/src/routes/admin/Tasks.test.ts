import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskStatus } from '@prisma/client';

// Mock the auth middleware to bypass authentication in unit tests
vi.mock('../../middleware/AuthMiddleware', () => ({
  authMiddleware: vi.fn((req, res, next) => next()),
}));

vi.mock('../../middleware/Admin', () => ({
  adminMiddleware: vi.fn((req, res, next) => next()),
}));

// Use vi.hoisted() to create mocks before module imports
const { mockPrisma } = vi.hoisted(() => {
  const mockPrismaInstance = {
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
    taskWorker: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb: any) => cb(mockPrismaInstance)),
  };
  return { mockPrisma: mockPrismaInstance };
});

// Mock the prisma singleton instance directly
vi.mock('../../utils/prisma', () => ({
  prisma: mockPrisma,
}));

// Import the module to get access to handlers
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../middleware/ErrorHandler';
import tasksRouter from './Tasks';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Use the imported router
  app.use('/api/admin/tasks', tasksRouter);

  // Error handler
  app.use(errorHandler);

  return app;
};

describe('Tasks Router', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/admin/tasks', () => {
    it('should return open tasks by default (hide closed tasks)', async () => {
      const mockTasks = [
        {
          id: BigInt(1),
          name: 'Task 1',
          projectId: BigInt(1),
          startDate: new Date('2026-01-01'),
          endDate: null,
          description: 'Description 1',
          status: 'open' as TaskStatus,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
          id: BigInt(2),
          name: 'Task 2',
          projectId: BigInt(1),
          startDate: null,
          endDate: null,
          description: null,
          status: 'open' as TaskStatus,
          createdAt: new Date('2026-01-02T00:00:00Z'),
          updatedAt: new Date('2026-01-02T00:00:00Z'),
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/admin/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Verify BigInt serialization
      expect(response.body.data[0].id).toBe('1');
      expect(response.body.data[1].id).toBe('2');

      // Verify Date serialization
      expect(response.body.data[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(response.body.data[0].updatedAt).toBe('2026-01-01T00:00:00.000Z');

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          status: 'open',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter by projectId when query param is provided', async () => {
      const mockTasks = [
        {
          id: BigInt(1),
          name: 'Task for Project 1',
          projectId: BigInt(1),
          startDate: null,
          endDate: null,
          description: null,
          status: 'open' as TaskStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/admin/tasks?projectId=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          projectId: BigInt(1),
          status: 'open',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when no tasks match filter', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should filter by status=open when query param is provided', async () => {
      const mockTasks = [
        {
          id: BigInt(1),
          name: 'Open Task',
          projectId: BigInt(1),
          startDate: null,
          endDate: null,
          description: null,
          status: 'open' as TaskStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/admin/tasks?status=open')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          status: 'open',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter by status=closed when query param is provided', async () => {
      const mockTasks = [
        {
          id: BigInt(1),
          name: 'Closed Task',
          projectId: BigInt(1),
          startDate: null,
          endDate: null,
          description: null,
          status: 'closed' as TaskStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/admin/tasks?status=closed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          status: 'closed',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return all tasks when status=all is provided', async () => {
      const mockTasks = [
        {
          id: BigInt(1),
          name: 'Open Task',
          projectId: BigInt(1),
          startDate: null,
          endDate: null,
          description: null,
          status: 'open' as TaskStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: BigInt(2),
          name: 'Closed Task',
          projectId: BigInt(1),
          startDate: null,
          endDate: null,
          description: null,
          status: 'closed' as TaskStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/admin/tasks?status=all')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should combine projectId and status filters', async () => {
      const mockTasks = [
        {
          id: BigInt(1),
          name: 'Closed Task for Project 1',
          projectId: BigInt(1),
          startDate: null,
          endDate: null,
          description: null,
          status: 'closed' as TaskStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/admin/tasks?projectId=1&status=closed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          projectId: BigInt(1),
          status: 'closed',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return 400 for invalid projectId query parameter (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/admin/tasks?projectId=abc')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.task.findMany).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/admin/tasks', () => {
    it('should create a new task successfully', async () => {
      const mockProject = {
        id: BigInt(1),
        name: 'Project 1',
      };
      const mockTask = {
        id: BigInt(1),
        name: 'New Task',
        projectId: BigInt(1),
        startDate: new Date('2026-01-20'),
        endDate: null,
        description: 'Test description',
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.task.create.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'New Task',
          projectId: 1,
          startDate: '2026-01-20',
          endDate: null,
          description: 'Test description',
          status: 'open',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1'); // BigInt serialized to string
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          name: 'New Task',
          projectId: BigInt(1),
          startDate: new Date('2026-01-20'),
          endDate: null,
          description: 'Test description',
          status: 'open',
        },
      });
    });

    it('should create task without optional fields', async () => {
      const mockProject = {
        id: BigInt(1),
        name: 'Project 1',
      };
      const mockTask = {
        id: BigInt(2),
        name: 'Task Without Optional Fields',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.task.create.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'Task Without Optional Fields',
          projectId: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          name: 'Task Without Optional Fields',
          projectId: BigInt(1),
          startDate: null,
          endDate: null,
          description: undefined,
          status: 'open',
        },
      });
    });

    it('should default status to open when not provided', async () => {
      const mockProject = {
        id: BigInt(1),
        name: 'Project 1',
      };
      const mockTask = {
        id: BigInt(3),
        name: 'Task with Default Status',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.task.create.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'Task with Default Status',
          projectId: 1,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'open',
        }),
      });
    });

    it('should return 404 if project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'New Task',
          projectId: 999,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Project not found');
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: '',
          projectId: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          projectId: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid projectId', async () => {
      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'Task',
          projectId: -1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'Task',
          projectId: 1,
          startDate: '01-20-2026', // Invalid format
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date - February 30', async () => {
      const mockProject = {
        id: BigInt(1),
        name: 'Project 1',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'Task',
          projectId: 1,
          startDate: '2026-02-30', // Invalid date (February doesn't have 30 days)
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid date - month 13', async () => {
      const mockProject = {
        id: BigInt(1),
        name: 'Project 1',
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/admin/tasks')
        .send({
          name: 'Task',
          projectId: 1,
          startDate: '2026-13-01', // Invalid month
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/admin/tasks/:id', () => {
    it('should update task successfully', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Original Task',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: 'Original description',
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue({
        ...existingTask,
        name: 'Updated Task',
        description: 'Updated description',
      });

      const response = await request(app)
        .put('/api/admin/tasks/1')
        .send({
          name: 'Updated Task',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          name: 'Updated Task',
          description: 'Updated description',
        },
      });
    });

    it('should update only name when only name is provided', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Original Task',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: 'Original description',
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue(existingTask);

      const response = await request(app)
        .put('/api/admin/tasks/1')
        .send({
          name: 'Updated Name Only',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          name: 'Updated Name Only',
        },
      });
    });

    it('should update projectId and verify project exists', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Task',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newProject = {
        id: BigInt(2),
        name: 'Project 2',
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.project.findUnique.mockResolvedValue(newProject);
      mockPrisma.task.update.mockResolvedValue({
        ...existingTask,
        projectId: BigInt(2),
      });

      const response = await request(app)
        .put('/api/admin/tasks/1')
        .send({
          projectId: 2,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(2) },
      });
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          projectId: BigInt(2),
        },
      });
    });

    it('should return 404 if project does not exist when updating projectId', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Task',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/admin/tasks/1')
        .send({
          projectId: 999,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Project not found');
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it('should update dates', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Task',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue(existingTask);

      const response = await request(app)
        .put('/api/admin/tasks/1')
        .send({
          startDate: '2026-01-20',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          startDate: new Date('2026-01-20'),
          endDate: new Date('2026-12-31'),
        },
      });
    });

    it('should set dates to null when null is provided', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Task',
        projectId: BigInt(1),
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-12-31'),
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue(existingTask);

      const response = await request(app)
        .put('/api/admin/tasks/1')
        .send({
          startDate: null,
          endDate: null,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          startDate: null,
          endDate: null,
        },
      });
    });

    it('should update status', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Task',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue({
        ...existingTask,
        status: 'closed' as TaskStatus,
      });

      const response = await request(app)
        .put('/api/admin/tasks/1')
        .send({
          status: 'closed',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          status: 'closed',
        },
      });
    });

    it('should return 404 if task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/admin/tasks/999')
        .send({
          name: 'Updated Task',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Task not found');
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it('should return 400 for empty name', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Task',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);

      const response = await request(app)
        .put('/api/admin/tasks/1')
        .send({
          name: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/tasks/:id', () => {
    it('should soft delete task (set status=closed)', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Task to Delete',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue({
        ...existingTask,
        status: 'closed' as TaskStatus,
      });

      const response = await request(app)
        .delete('/api/admin/tasks/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { status: 'closed' },
      });
    });

    it('should return 404 if task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/admin/tasks/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Task not found');
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      const response = await request(app)
        .put('/api/admin/tasks/xyz')
        .send({
          name: 'Updated Task',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.task.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/tasks/:id', () => {
    it('should soft delete task (set status=closed)', async () => {
      const existingTask = {
        id: BigInt(1),
        name: 'Task to Delete',
        projectId: BigInt(1),
        startDate: null,
        endDate: null,
        description: null,
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue({
        ...existingTask,
        status: 'closed' as TaskStatus,
      });

      const response = await request(app)
        .delete('/api/admin/tasks/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { status: 'closed' },
      });
    });

    it('should return 404 if task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/admin/tasks/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Task not found');
      expect(mockPrisma.task.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      const response = await request(app)
        .delete('/api/admin/tasks/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.task.findUnique).not.toHaveBeenCalled();
    });
  });
});

