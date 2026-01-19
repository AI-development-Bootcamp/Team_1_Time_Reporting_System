import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/utils/prismaClient';
import { Bcrypt } from '../../src/utils/Bcrypt';
import jwt from 'jsonwebtoken';

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

describe('GET /api/admin/assignments/:taskId/users - HTTP Integration', () => {
    let adminToken: string;
    let workerToken: string;
    let adminUserId: bigint;
    let workerUserId1: bigint;
    let workerUserId2: bigint;
    let inactiveWorkerUserId: bigint;
    let clientId: bigint;
    let projectId: bigint;
    let taskId: bigint;
    let emptyTaskId: bigint;
    let regularWorkerId: bigint;

    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.taskWorker.deleteMany({
            where: {
                user: {
                    mail: {
                        in: [
                            'test-admin-http-assign@test.com',
                            'test-worker-http-assign@test.com',
                            'test-worker1-http-assign@test.com',
                            'test-worker2-http-assign@test.com',
                            'test-inactive-http-assign@test.com',
                        ],
                    },
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                mail: {
                    in: [
                        'test-admin-http-assign@test.com',
                        'test-worker-http-assign@test.com',
                        'test-worker1-http-assign@test.com',
                        'test-worker2-http-assign@test.com',
                        'test-inactive-http-assign@test.com',
                    ],
                },
            },
        });

        await prisma.task.deleteMany({
            where: {
                name: {
                    in: ['Test HTTP Assignment Task', 'Test HTTP Empty Task'],
                },
            },
        });

        await prisma.project.deleteMany({
            where: {
                name: 'Test HTTP Assignment Project',
            },
        });

        await prisma.client.deleteMany({
            where: {
                name: 'Test HTTP Assignment Client',
            },
        });

        // Create test admin user
        const hashedPassword = await Bcrypt.hash('TestPassword123!');
        const adminUser = await prisma.user.create({
            data: {
                name: 'Test Admin HTTP',
                mail: 'test-admin-http-assign@test.com',
                password: hashedPassword,
                userType: 'admin',
                active: true,
            },
        });
        adminUserId = adminUser.id;

        // Create regular worker for auth test
        const regularWorker = await prisma.user.create({
            data: {
                name: 'Test Worker Regular',
                mail: 'test-worker-http-assign@test.com',
                password: hashedPassword,
                userType: 'worker',
                active: true,
            },
        });
        regularWorkerId = regularWorker.id;

        // Create test workers to assign
        const worker1 = await prisma.user.create({
            data: {
                name: 'Test Worker Alpha',
                mail: 'test-worker1-http-assign@test.com',
                password: hashedPassword,
                userType: 'worker',
                active: true,
            },
        });
        workerUserId1 = worker1.id;

        const worker2 = await prisma.user.create({
            data: {
                name: 'Test Worker Beta',
                mail: 'test-worker2-http-assign@test.com',
                password: hashedPassword,
                userType: 'worker',
                active: true,
            },
        });
        workerUserId2 = worker2.id;

        // Create inactive worker
        const inactiveWorker = await prisma.user.create({
            data: {
                name: 'Test Inactive Worker',
                mail: 'test-inactive-http-assign@test.com',
                password: hashedPassword,
                userType: 'worker',
                active: false,
            },
        });
        inactiveWorkerUserId = inactiveWorker.id;

        // Generate JWT tokens
        adminToken = jwt.sign(
            {
                userId: adminUserId.toString(),
                userType: 'admin',
                user: {
                    id: Number(adminUserId),
                    name: 'Test Admin HTTP',
                    mail: 'test-admin-http-assign@test.com',
                    userType: 'admin',
                    active: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        workerToken = jwt.sign(
            {
                userId: regularWorkerId.toString(),
                userType: 'worker',
                user: {
                    id: Number(regularWorkerId),
                    name: 'Test Worker Regular',
                    mail: 'test-worker-http-assign@test.com',
                    userType: 'worker',
                    active: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create client, project, and tasks
        const client = await prisma.client.create({
            data: {
                name: 'Test HTTP Assignment Client',
                description: 'Test client',
            },
        });
        clientId = client.id;

        const project = await prisma.project.create({
            data: {
                name: 'Test HTTP Assignment Project',
                clientId: clientId,
                projectManagerId: adminUserId,
                startDate: new Date('2026-01-01'),
            },
        });
        projectId = project.id;

        const task = await prisma.task.create({
            data: {
                name: 'Test HTTP Assignment Task',
                projectId: projectId,
                status: 'open',
            },
        });
        taskId = task.id;

        // Create a task with no assignments
        const emptyTask = await prisma.task.create({
            data: {
                name: 'Test HTTP Empty Task',
                projectId: projectId,
                status: 'open',
            },
        });
        emptyTaskId = emptyTask.id;

        // Assign workers to task (including inactive worker)
        await prisma.taskWorker.createMany({
            data: [
                { taskId: taskId, userId: workerUserId1 },
                { taskId: taskId, userId: workerUserId2 },
                { taskId: taskId, userId: inactiveWorkerUserId },
            ],
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.taskWorker.deleteMany({
            where: {
                taskId: {
                    in: [taskId, emptyTaskId],
                },
            },
        });

        await prisma.task.deleteMany({
            where: {
                id: {
                    in: [taskId, emptyTaskId],
                },
            },
        });

        await prisma.project.deleteMany({
            where: {
                id: projectId,
            },
        });

        await prisma.client.deleteMany({
            where: {
                id: clientId,
            },
        });

        await prisma.user.deleteMany({
            where: {
                id: {
                    in: [adminUserId, regularWorkerId, workerUserId1, workerUserId2, inactiveWorkerUserId],
                },
            },
        });
    });

    it('should return 200 with list of active workers assigned to task', async () => {
        const response = await request(app)
            .get(`/api/admin/assignments/${taskId}/users`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(2);

        expect(response.body.data).toEqual(
            expect.arrayContaining([
                { id: Number(workerUserId1), name: 'Test Worker Alpha' },
                { id: Number(workerUserId2), name: 'Test Worker Beta' },
            ])
        );

        // Should not include inactive worker
        const inactiveWorkerInResponse = response.body.data.find(
            (w: any) => w.id === Number(inactiveWorkerUserId)
        );
        expect(inactiveWorkerInResponse).toBeUndefined();
    });

    it('should return 200 with empty array if no workers assigned to task', async () => {
        const response = await request(app)
            .get(`/api/admin/assignments/${emptyTaskId}/users`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toEqual([]);
    });

    it('should return 404 if task does not exist', async () => {
        const nonExistentTaskId = 999999;
        const response = await request(app)
            .get(`/api/admin/assignments/${nonExistentTaskId}/users`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
        expect(response.body.error).toHaveProperty('message', 'Task not found');
    });

    it('should return 401 if not authenticated', async () => {
        const response = await request(app)
            .get(`/api/admin/assignments/${taskId}/users`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
    });

    it('should return 403 if user is not admin', async () => {
        const response = await request(app)
            .get(`/api/admin/assignments/${taskId}/users`)
            .set('Authorization', `Bearer ${workerToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should only return id and name fields', async () => {
        const response = await request(app)
            .get(`/api/admin/assignments/${taskId}/users`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);

        response.body.data.forEach((worker: any) => {
            expect(Object.keys(worker)).toEqual(['id', 'name']);
            expect(worker).toHaveProperty('id');
            expect(worker).toHaveProperty('name');
            expect(typeof worker.id).toBe('number');
            expect(typeof worker.name).toBe('string');
        });
    });
});
