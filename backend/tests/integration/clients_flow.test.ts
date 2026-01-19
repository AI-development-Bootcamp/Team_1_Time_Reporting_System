import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../src/middleware/ErrorHandler';
import clientsRouter from '../../src/routes/admin/Clients';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use('/api/admin/clients', clientsRouter);
app.use(errorHandler);

describe('Clients API Integration Tests', () => {
  let createdClientIds: bigint[] = [];

  beforeAll(async () => {
    // Ensure database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdClientIds.length > 0) {
      await prisma.client.deleteMany({
        where: {
          id: { in: createdClientIds },
        },
      });
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Clear created IDs for each test
    createdClientIds = [];
  });

  describe('Full CRUD Workflow', () => {
    it('should create, read, update, and soft delete a client', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/api/admin/clients')
        .send({
          name: `Integration Test Client ${Date.now()}`,
          description: 'Test client for integration testing',
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.id).toBeDefined();
      const clientId = BigInt(createResponse.body.data.id);
      createdClientIds.push(clientId);

      // Verify in database
      const createdClient = await prisma.client.findUnique({
        where: { id: clientId },
      });
      expect(createdClient).toBeDefined();
      expect(createdClient?.name).toContain('Integration Test Client');
      expect(createdClient?.active).toBe(true);

      // READ - Get all clients (should include our new client)
      const listResponse = await request(app)
        .get('/api/admin/clients')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      const foundClient = listResponse.body.data.find(
        (c: any) => c.id === createResponse.body.data.id
      );
      expect(foundClient).toBeDefined();
      expect(foundClient.name).toContain('Integration Test Client');

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/admin/clients/${clientId}`)
        .send({
          name: 'Updated Integration Test Client',
          description: 'Updated description',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Verify update in database
      const updatedClient = await prisma.client.findUnique({
        where: { id: clientId },
      });
      expect(updatedClient?.name).toBe('Updated Integration Test Client');
      expect(updatedClient?.description).toBe('Updated description');

      // SOFT DELETE
      const deleteResponse = await request(app)
        .delete(`/api/admin/clients/${clientId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify soft delete in database
      const deletedClient = await prisma.client.findUnique({
        where: { id: clientId },
      });
      expect(deletedClient?.active).toBe(false);

      // Verify client is hidden from default list
      const listAfterDeleteResponse = await request(app)
        .get('/api/admin/clients')
        .expect(200);

      const hiddenClient = listAfterDeleteResponse.body.data.find(
        (c: any) => c.id === createResponse.body.data.id
      );
      expect(hiddenClient).toBeUndefined();
    });

    it('should handle duplicate client name conflict', async () => {
      const clientName = `Duplicate Test Client ${Date.now()}`;

      // Create first client
      const firstResponse = await request(app)
        .post('/api/admin/clients')
        .send({
          name: clientName,
          description: 'First client',
        })
        .expect(201);

      const firstClientId = BigInt(firstResponse.body.data.id);
      createdClientIds.push(firstClientId);

      // Try to create duplicate
      const duplicateResponse = await request(app)
        .post('/api/admin/clients')
        .send({
          name: clientName,
          description: 'Duplicate client',
        })
        .expect(409);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.error.code).toBe('CONFLICT');
      expect(duplicateResponse.body.error.message).toContain('already exists');

      // Verify only one client exists in database
      const clients = await prisma.client.findMany({
        where: { name: clientName },
      });
      expect(clients).toHaveLength(1);
    });

    it('should filter clients by active status', async () => {
      // Create active client
      const activeResponse = await request(app)
        .post('/api/admin/clients')
        .send({
          name: `Active Client ${Date.now()}`,
        })
        .expect(201);

      const activeClientId = BigInt(activeResponse.body.data.id);
      createdClientIds.push(activeClientId);

      // Soft delete it
      await request(app)
        .delete(`/api/admin/clients/${activeClientId}`)
        .expect(200);

      // Get active clients (should not include deleted one)
      const activeListResponse = await request(app)
        .get('/api/admin/clients?active=true')
        .expect(200);

      const foundInActive = activeListResponse.body.data.find(
        (c: any) => c.id === activeResponse.body.data.id
      );
      expect(foundInActive).toBeUndefined();
    });
  });
});

