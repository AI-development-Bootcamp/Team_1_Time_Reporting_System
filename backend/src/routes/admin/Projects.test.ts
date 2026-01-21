import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportingType, TaskStatus } from '@prisma/client';

// Use vi.hoisted() to create mocks before module imports
const { mockPrisma } = vi.hoisted(() => {
  const mockPrismaInstance = {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),      // Needed for your NEW feature
      updateMany: vi.fn(),      // Needed for entity_management feature
    },
    taskWorker: {
      deleteMany: vi.fn(),      // Needed for entity_management feature
    },
    $transaction: vi.fn((cb: any) => cb(mockPrismaInstance)), // Needed for entity_management
  };
  return { mockPrisma: mockPrismaInstance };
});

vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: vi.fn(() => mockPrisma),
  };
});

// Don't mock ApiResponse - we want to test the real serialization behavior

// Import the module to get access to handlers
// We'll need to test the actual route handlers
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../middleware/ErrorHandler';
import projectsRouter from './Projects';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Use the imported router
  app.use('/api/admin/projects', projectsRouter);
  
  // Error handler
  app.use(errorHandler);
  
  return app;
};

describe('Projects Router', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/admin/projects', () => {
    it('should return all projects when no filter is provided', async () => {
      const mockProjects = [
        {
          id: BigInt(1),
          name: 'Project 1',
          clientId: BigInt(1),
          projectManagerId: BigInt(1),
          startDate: new Date('2026-01-01'),
          endDate: null,
          description: 'Test project',
          reportingType: 'startEnd' as ReportingType,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/admin/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter projects by clientId when query param is provided', async () => {
      const mockProjects = [
        {
          id: BigInt(1),
          name: 'Project 1',
          clientId: BigInt(1),
          projectManagerId: BigInt(1),
          startDate: new Date('2026-01-01'),
          endDate: null,
          description: 'Test project',
          reportingType: 'startEnd' as ReportingType,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/admin/projects?clientId=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          clientId: BigInt(1),
          active: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Verify all returned projects belong to the filtered client
      const allMatch = response.body.data.every((p: any) => p.clientId === '1');
      expect(allMatch).toBe(true);
    });

    it('should filter by active=true when query param is provided', async () => {
      const mockProjects = [
        {
          id: BigInt(1),
          name: 'Active Project',
          clientId: BigInt(1),
          projectManagerId: BigInt(1),
          startDate: new Date('2026-01-01'),
          endDate: null,
          description: null,
          reportingType: 'startEnd' as ReportingType,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/admin/projects?active=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter by active=false when query param is provided', async () => {
      const mockProjects = [
        {
          id: BigInt(1),
          name: 'Inactive Project',
          clientId: BigInt(1),
          projectManagerId: BigInt(1),
          startDate: new Date('2026-01-01'),
          endDate: null,
          description: null,
          reportingType: 'startEnd' as ReportingType,
          active: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/admin/projects?active=false')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          active: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return 400 for invalid clientId query parameter (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/admin/projects?clientId=abc')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.project.findMany).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/admin/projects', () => {
    it('should create a new project successfully', async () => {
      const mockClient = { id: BigInt(1), name: 'Client 1' };
      const mockUser = { id: BigInt(1), name: 'Manager 1' };
      const mockProject = {
        id: BigInt(1),
        name: 'New Project',
        clientId: BigInt(1),
        projectManagerId: BigInt(1),
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        description: 'Test project',
        reportingType: 'startEnd' as ReportingType,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.project.create.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'New Project',
          clientId: 1,
          projectManagerId: 1,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          description: 'Test project',
          reportingType: 'startEnd',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1');
      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
      expect(mockPrisma.project.create).toHaveBeenCalled();
    });

    it('should return 404 if client does not exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'New Project',
          clientId: 999,
          projectManagerId: 1,
          startDate: '2026-01-01',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Client not found');
    });

    it('should return 404 if project manager does not exist', async () => {
      const mockClient = { id: BigInt(1), name: 'Client 1' };
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'New Project',
          clientId: 1,
          projectManagerId: 999,
          startDate: '2026-01-01',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Project manager not found');
    });

    it('should default reportingType to startEnd if not provided', async () => {
      const mockClient = { id: BigInt(1) };
      const mockUser = { id: BigInt(1) };
      const mockProject = { id: BigInt(1) };

      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.project.create.mockResolvedValue(mockProject);

      await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'New Project',
          clientId: 1,
          projectManagerId: 1,
          startDate: '2026-01-01',
        })
        .expect(201);

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reportingType: 'startEnd',
        }),
      });
    });
  });

  describe('PUT /api/admin/projects/:id', () => {
    it('should update project successfully', async () => {
      const existingProject = {
        id: BigInt(1),
        name: 'Original Project',
        clientId: BigInt(1),
        projectManagerId: BigInt(1),
        startDate: new Date('2026-01-01'),
        endDate: null,
        description: 'Original description',
        reportingType: 'startEnd' as ReportingType,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({ ...existingProject, name: 'Updated Project' });

      const response = await request(app)
        .put('/api/admin/projects/1')
        .send({
          name: 'Updated Project',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(true);
      expect(mockPrisma.project.update).toHaveBeenCalled();
    });

    it('should return 404 if project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/admin/projects/999')
        .send({ name: 'Updated Project' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      const response = await request(app)
        .put('/api/admin/projects/abc')
        .send({ name: 'Updated Project' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it('should validate client exists when updating clientId', async () => {
      const existingProject = {
        id: BigInt(1),
        name: 'Project',
        clientId: BigInt(1),
        projectManagerId: BigInt(1),
        startDate: new Date('2026-01-01'),
        endDate: null,
        description: null,
        reportingType: 'startEnd' as ReportingType,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/admin/projects/1')
        .send({ clientId: 999 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Client not found');
    });
  });

  describe('PATCH /api/admin/projects/:id', () => {
    it('should toggle reportingType from startEnd to duration', async () => {
      const existingProject = {
        id: BigInt(1),
        name: 'Project',
        clientId: BigInt(1),
        projectManagerId: BigInt(1),
        startDate: new Date('2026-01-01'),
        endDate: null,
        description: null,
        reportingType: 'startEnd' as ReportingType,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({
        ...existingProject,
        reportingType: 'duration' as ReportingType,
      });

      const response = await request(app)
        .patch('/api/admin/projects/1')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(true);
      expect(response.body.data.reportingType).toBe('duration');
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { reportingType: 'duration' },
      });
    });

    it('should toggle reportingType from duration to startEnd', async () => {
      const existingProject = {
        id: BigInt(1),
        name: 'Project',
        clientId: BigInt(1),
        projectManagerId: BigInt(1),
        startDate: new Date('2026-01-01'),
        endDate: null,
        description: null,
        reportingType: 'duration' as ReportingType,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({
        ...existingProject,
        reportingType: 'startEnd' as ReportingType,
      });

      const response = await request(app)
        .patch('/api/admin/projects/1')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportingType).toBe('startEnd');
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { reportingType: 'startEnd' },
      });
    });

    it('should return 404 if project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/admin/projects/999')
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      const response = await request(app)
        .patch('/api/admin/projects/xyz')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/projects/:id', () => {
    it('should soft delete project (set active=false)', async () => {
      const existingProject = {
        id: BigInt(1),
        name: 'Project',
        clientId: BigInt(1),
        projectManagerId: BigInt(1),
        startDate: new Date('2026-01-01'),
        endDate: null,
        description: null,
        reportingType: 'startEnd' as ReportingType,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue({
        ...existingProject,
        active: false,
      });

      const response = await request(app)
        .delete('/api/admin/projects/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { active: false },
      });
    });

    it('should return 404 if project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/admin/projects/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Project not found');
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      const response = await request(app)
        .delete('/api/admin/projects/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: '',
          clientId: 1,
          projectManagerId: 1,
          startDate: '2026-01-01',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'Test Project',
          clientId: 1,
          projectManagerId: 1,
          startDate: '01-01-2026', // Invalid format
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date - February 30', async () => {
      const mockClient = { id: BigInt(1), name: 'Client 1' };
      const mockUser = { id: BigInt(1), name: 'Manager 1' };

      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'Test Project',
          clientId: 1,
          projectManagerId: 1,
          startDate: '2026-02-30', // Invalid date (February doesn't have 30 days)
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid date - month 13', async () => {
      const mockClient = { id: BigInt(1), name: 'Client 1' };
      const mockUser = { id: BigInt(1), name: 'Manager 1' };

      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'Test Project',
          clientId: 1,
          projectManagerId: 1,
          startDate: '2026-13-01', // Invalid month
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid date - day 45', async () => {
      const mockClient = { id: BigInt(1), name: 'Client 1' };
      const mockUser = { id: BigInt(1), name: 'Manager 1' };

      mockPrisma.client.findUnique.mockResolvedValue(mockClient);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/admin/projects')
        .send({
          name: 'Test Project',
          clientId: 1,
          projectManagerId: 1,
          startDate: '2026-01-45', // Invalid day
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/projects/by-task/:taskId', () => {
    it('should return project successfully by taskId', async () => {
      const mockTask = {
        id: BigInt(1),
        name: 'Task 1',
        projectId: BigInt(1),
        startDate: new Date('2026-01-01'),
        endDate: null,
        description: 'Task description',
        status: 'open' as TaskStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        project: {
          id: BigInt(1),
          name: 'Project 1',
          clientId: BigInt(1),
          projectManagerId: BigInt(1),
          startDate: new Date('2026-01-01'),
          endDate: null,
          description: 'Project description',
          reportingType: 'startEnd' as ReportingType,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockPrisma.task.findUnique.mockResolvedValue(mockTask);

      const response = await request(app)
        .get('/api/admin/projects/by-task/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.name).toBe('Project 1');
      expect(response.body.data.clientId).toBe(1);
      expect(response.body.data.projectManagerId).toBe(1);
      expect(response.body.data.reportingType).toBe('startEnd');
      expect(response.body.data.active).toBe(true);
      
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: { project: true },
      });
    });

    it('should return 404 if task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/projects/by-task/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Task not found');
      
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(999) },
        include: { project: true },
      });
    });

    it('should return 400 for invalid taskId format (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/admin/projects/by-task/abc')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.task.findUnique).not.toHaveBeenCalled();
    });

    it('should return project with all fields correctly formatted', async () => {
      const mockTask = {
        id: BigInt(2),
        name: 'Task 2',
        projectId: BigInt(2),
        startDate: null,
        endDate: null,
        description: null,
        status: 'closed' as TaskStatus,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
        project: {
          id: BigInt(2),
          name: 'Project 2',
          clientId: BigInt(2),
          projectManagerId: BigInt(2),
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          description: 'Project with end date',
          reportingType: 'duration' as ReportingType,
          active: false,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-02T00:00:00Z'),
        },
      };

      mockPrisma.task.findUnique.mockResolvedValue(mockTask);

      const response = await request(app)
        .get('/api/admin/projects/by-task/2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(2);
      expect(response.body.data.name).toBe('Project 2');
      expect(response.body.data.startDate).toBe('2026-01-01');
      expect(response.body.data.endDate).toBe('2026-12-31');
      expect(response.body.data.description).toBe('Project with end date');
      expect(response.body.data.reportingType).toBe('duration');
      expect(response.body.data.active).toBe(false);
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });
  });
});
