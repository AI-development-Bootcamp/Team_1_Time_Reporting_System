import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../middleware/ErrorHandler';
import assignmentsRouter from './Assignments';

// Use vi.hoisted() to create mocks before module imports
const { mockPrisma } = vi.hoisted(() => {
  const mockPrismaInstance = {
    taskWorker: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };
  return { mockPrisma: mockPrismaInstance };
});

// Mock the prisma singleton instance directly
vi.mock('../../utils/prisma', () => ({
  prisma: mockPrisma,
}));

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Use the imported router
  app.use('/api/admin/assignments', assignmentsRouter);

  // Error handler
  app.use(errorHandler);

  return app;
};

describe('Assignments Router', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/admin/assignments', () => {
    it('should return all assignments with related data', async () => {
      const mockAssignments = [
        {
          taskId: BigInt(1),
          userId: BigInt(10),
          user: {
            id: BigInt(10),
            name: 'Worker 1',
            mail: 'worker1@example.com',
            password: 'hashed',
            userType: 'worker',
            active: true,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
          },
          task: {
            id: BigInt(1),
            name: 'Task 1',
            projectId: BigInt(100),
            startDate: null,
            endDate: null,
            description: 'Test task',
            status: 'open',
            createdAt: new Date('2026-01-02T00:00:00Z'),
            updatedAt: new Date('2026-01-02T00:00:00Z'),
            project: {
              id: BigInt(100),
              name: 'Project 1',
              clientId: BigInt(200),
              projectManagerId: BigInt(20),
              startDate: new Date('2026-01-01'),
              endDate: null,
              description: 'Test project',
              reportingType: 'startEnd',
              active: true,
              createdAt: new Date('2026-01-01T00:00:00Z'),
              updatedAt: new Date('2026-01-01T00:00:00Z'),
              client: {
                id: BigInt(200),
                name: 'Client 1',
                description: null,
                active: true,
                createdAt: new Date('2026-01-01T00:00:00Z'),
                updatedAt: new Date('2026-01-01T00:00:00Z'),
              },
            },
          },
        },
      ];

      mockPrisma.taskWorker.findMany.mockResolvedValue(mockAssignments);

      const response = await request(app)
        .get('/api/admin/assignments')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);

      // BigInt serialization
      expect(response.body.data[0].taskId).toBe('1');
      expect(response.body.data[0].userId).toBe('10');
      expect(response.body.data[0].user.id).toBe('10');
      expect(response.body.data[0].task.id).toBe('1');
      expect(response.body.data[0].task.project.id).toBe('100');
      expect(response.body.data[0].task.project.client.id).toBe('200');

      expect(mockPrisma.taskWorker.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          task: {
            include: {
              project: {
                include: {
                  client: true,
                },
              },
            },
          },
        },
      });
    });
  });

  describe('POST /api/admin/assignments', () => {
    it('should create a new assignment successfully', async () => {
      const mockAssignment = {
        taskId: BigInt(1),
        userId: BigInt(10),
      };

      mockPrisma.task.findUnique.mockResolvedValue({
        id: BigInt(1),
        status: 'open',
        project: {
          active: true,
          client: {
            active: true,
          },
        },
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: BigInt(10) });
      mockPrisma.taskWorker.findUnique.mockResolvedValue(null);
      mockPrisma.taskWorker.create.mockResolvedValue(mockAssignment);

      const response = await request(app)
        .post('/api/admin/assignments')
        .send({
          taskId: '1',
          userId: '10',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1:10');
      expect(response.body.data.taskId).toBe('1');
      expect(response.body.data.userId).toBe('10');

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      expect(mockPrisma.taskWorker.findUnique).toHaveBeenCalledWith({
        where: {
          taskId_userId: {
            taskId: BigInt(1),
            userId: BigInt(10),
          },
        },
      });

      expect(mockPrisma.taskWorker.create).toHaveBeenCalledWith({
        data: {
          taskId: BigInt(1),
          userId: BigInt(10),
        },
      });
    });

    it('should return 409 if assignment already exists', async () => {
      const existingAssignment = {
        taskId: BigInt(1),
        userId: BigInt(10),
      };

      mockPrisma.task.findUnique.mockResolvedValue({
        id: BigInt(1),
        status: 'open',
        project: {
          active: true,
          client: {
            active: true,
          },
        },
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: BigInt(10) });
      mockPrisma.taskWorker.findUnique.mockResolvedValue(existingAssignment);

      const response = await request(app)
        .post('/api/admin/assignments')
        .send({
          taskId: '1',
          userId: '10',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Assignment already exists');
      expect(mockPrisma.taskWorker.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid body', async () => {
      const response = await request(app)
        .post('/api/admin/assignments')
        .send({
          taskId: 'not-a-number',
          userId: '10',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.taskWorker.create).not.toHaveBeenCalled();
    });

    it('should return 409 if task is closed', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: BigInt(1),
        status: 'closed',
        project: {
          active: true,
          client: {
            active: true,
          },
        },
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: BigInt(10) });

      const response = await request(app)
        .post('/api/admin/assignments')
        .send({
          taskId: '1',
          userId: '10',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Cannot assign user to a closed task');
      expect(mockPrisma.taskWorker.create).not.toHaveBeenCalled();
    });

    it('should return 409 if project is inactive', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: BigInt(1),
        status: 'open',
        project: {
          active: false,
          client: {
            active: true,
          },
        },
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: BigInt(10) });

      const response = await request(app)
        .post('/api/admin/assignments')
        .send({
          taskId: '1',
          userId: '10',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Cannot assign user to a task in an inactive project');
      expect(mockPrisma.taskWorker.create).not.toHaveBeenCalled();
    });

    it('should return 409 if client is inactive', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: BigInt(1),
        status: 'open',
        project: {
          active: true,
          client: {
            active: false,
          },
        },
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: BigInt(10) });

      const response = await request(app)
        .post('/api/admin/assignments')
        .send({
          taskId: '1',
          userId: '10',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Cannot assign user to a task for an inactive client');
      expect(mockPrisma.taskWorker.create).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/assignments/:id', () => {
    it('should delete an existing assignment', async () => {
      const existingAssignment = {
        taskId: BigInt(1),
        userId: BigInt(10),
      };

      mockPrisma.taskWorker.findUnique.mockResolvedValue(existingAssignment);
      mockPrisma.taskWorker.delete.mockResolvedValue(existingAssignment);

      const response = await request(app)
        // id format is "taskId:userId"
        .delete('/api/admin/assignments/1:10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      expect(mockPrisma.taskWorker.delete).toHaveBeenCalledWith({
        where: {
          taskId_userId: {
            taskId: BigInt(1),
            userId: BigInt(10),
          },
        },
      });
    });

    it('should return 404 if assignment does not exist', async () => {
      mockPrisma.taskWorker.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/admin/assignments/1:10')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Assignment not found');
      expect(mockPrisma.taskWorker.delete).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .delete('/api/admin/assignments/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.taskWorker.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.taskWorker.delete).not.toHaveBeenCalled();
    });
  });
});


