import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use vi.hoisted() to create mocks before module imports
const { mockPrisma } = vi.hoisted(() => {
  const mockPrismaInstance = {
    client: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
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
import clientsRouter from './Clients';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Use the imported router
  app.use('/api/admin/clients', clientsRouter);
  
  // Error handler
  app.use(errorHandler);
  
  return app;
};

describe('Clients Router', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/admin/clients', () => {
    it('should return active clients by default', async () => {
      const mockClients = [
        {
          id: BigInt(1),
          name: 'Client 1',
          description: 'Description 1',
          active: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
          id: BigInt(2),
          name: 'Client 2',
          description: null,
          active: true,
          createdAt: new Date('2026-01-02T00:00:00Z'),
          updatedAt: new Date('2026-01-02T00:00:00Z'),
        },
      ];

      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const response = await request(app)
        .get('/api/admin/clients')
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

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter by active=true when query param is provided', async () => {
      const mockClients = [
        {
          id: BigInt(1),
          name: 'Active Client',
          description: null,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const response = await request(app)
        .get('/api/admin/clients?active=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter by active=false when query param is provided', async () => {
      const mockClients = [
        {
          id: BigInt(1),
          name: 'Inactive Client',
          description: null,
          active: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const response = await request(app)
        .get('/api/admin/clients?active=false')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith({
        where: {
          active: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array when no clients match filter', async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/clients')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/admin/clients', () => {
    it('should create a new client successfully', async () => {
      const mockClient = {
        id: BigInt(1),
        name: 'New Client',
        description: 'Test description',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findFirst.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/admin/clients')
        .send({
          name: 'New Client',
          description: 'Test description',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('1'); // BigInt serialized to string
      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'New Client',
        },
      });
      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          name: 'New Client',
          description: 'Test description',
          active: true,
        },
      });
    });

    it('should create client without description', async () => {
      const mockClient = {
        id: BigInt(2),
        name: 'Client Without Description',
        description: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findFirst.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/admin/clients')
        .send({
          name: 'Client Without Description',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          name: 'Client Without Description',
          description: undefined,
          active: true,
        },
      });
    });

    it('should return 409 if client with same name already exists', async () => {
      const existingClient = {
        id: BigInt(1),
        name: 'Existing Client',
        description: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findFirst.mockResolvedValue(existingClient);

      const response = await request(app)
        .post('/api/admin/clients')
        .send({
          name: 'Existing Client',
          description: 'Test',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toBe('Client with this name already exists');
      expect(mockPrisma.client.create).not.toHaveBeenCalled();
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/admin/clients')
        .send({
          name: '',
          description: 'Test',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/admin/clients')
        .send({
          description: 'Test',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/admin/clients/:id', () => {
    it('should update client successfully', async () => {
      const existingClient = {
        id: BigInt(1),
        name: 'Original Client',
        description: 'Original description',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue(existingClient);
      mockPrisma.client.update.mockResolvedValue({
        ...existingClient,
        name: 'Updated Client',
        description: 'Updated description',
      });

      const response = await request(app)
        .put('/api/admin/clients/1')
        .send({
          name: 'Updated Client',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(true);
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          name: 'Updated Client',
          description: 'Updated description',
        },
      });
    });

    it('should update only name when only name is provided', async () => {
      const existingClient = {
        id: BigInt(1),
        name: 'Original Client',
        description: 'Original description',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue(existingClient);
      mockPrisma.client.update.mockResolvedValue(existingClient);

      const response = await request(app)
        .put('/api/admin/clients/1')
        .send({
          name: 'Updated Name Only',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          name: 'Updated Name Only',
        },
      });
    });

    it('should update only description when only description is provided', async () => {
      const existingClient = {
        id: BigInt(1),
        name: 'Client',
        description: 'Original description',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue(existingClient);
      mockPrisma.client.update.mockResolvedValue(existingClient);

      const response = await request(app)
        .put('/api/admin/clients/1')
        .send({
          description: 'New description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          description: 'New description',
        },
      });
    });

    it('should set description to null when null is provided', async () => {
      const existingClient = {
        id: BigInt(1),
        name: 'Client',
        description: 'Original description',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue(existingClient);
      mockPrisma.client.update.mockResolvedValue(existingClient);

      const response = await request(app)
        .put('/api/admin/clients/1')
        .send({
          description: null,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          description: null,
        },
      });
    });

    it('should update active status', async () => {
      const existingClient = {
        id: BigInt(1),
        name: 'Client',
        description: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue(existingClient);
      mockPrisma.client.update.mockResolvedValue({
        ...existingClient,
        active: false,
      });

      const response = await request(app)
        .put('/api/admin/clients/1')
        .send({
          active: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          active: false,
        },
      });
    });

    it('should return 404 if client does not exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/admin/clients/999')
        .send({
          name: 'Updated Client',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Client not found');
      expect(mockPrisma.client.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      const response = await request(app)
        .put('/api/admin/clients/abc')
        .send({
          name: 'Updated Client',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.client.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 for empty name', async () => {
      const existingClient = {
        id: BigInt(1),
        name: 'Client',
        description: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue(existingClient);

      const response = await request(app)
        .put('/api/admin/clients/1')
        .send({
          name: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.client.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/clients/:id', () => {
    it('should soft delete client (set active=false)', async () => {
      const existingClient = {
        id: BigInt(1),
        name: 'Client to Delete',
        description: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.client.findUnique.mockResolvedValue(existingClient);
      mockPrisma.client.update.mockResolvedValue({
        ...existingClient,
        active: false,
      });

      const response = await request(app)
        .delete('/api/admin/clients/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
      expect(mockPrisma.client.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { active: false },
      });
    });

    it('should return 404 if client does not exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/admin/clients/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Client not found');
      expect(mockPrisma.client.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid ID format (non-numeric)', async () => {
      const response = await request(app)
        .delete('/api/admin/clients/xyz')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.client.findUnique).not.toHaveBeenCalled();
    });
  });
});

