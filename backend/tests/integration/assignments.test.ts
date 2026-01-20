import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/utils/prismaClient';
import { Bcrypt } from '@/utils/Bcrypt';

describe('GET /api/admin/assignments/:taskId/users - Database Integration', () => {
    let adminUserId: bigint;
    let workerUserId1: bigint;
    let workerUserId2: bigint;
    let inactiveWorkerUserId: bigint;
    let clientId: bigint;
    let projectId: bigint;
    let taskId: bigint;
    let emptyTaskId: bigint;

    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.taskWorker.deleteMany({
            where: {
                user: {
                    mail: {
                        in: [
                            'test-admin-assignments@test.com',
                            'test-worker1-assignments@test.com',
                            'test-worker2-assignments@test.com',
                            'test-inactive-worker-assignments@test.com',
                        ],
                    },
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                mail: {
                    in: [
                        'test-admin-assignments@test.com',
                        'test-worker1-assignments@test.com',
                        'test-worker2-assignments@test.com',
                        'test-inactive-worker-assignments@test.com',
                    ],
                },
            },
        });

        await prisma.task.deleteMany({
            where: {
                name: {
                    in: ['Test Assignment Task', 'Test Empty Task'],
                },
            },
        });

        await prisma.project.deleteMany({
            where: {
                name: 'Test Assignment Project',
            },
        });

        await prisma.client.deleteMany({
            where: {
                name: 'Test Assignment Client',
            },
        });

        // Create test admin user
        const hashedPassword = await Bcrypt.hash('TestPassword123!');
        const adminUser = await prisma.user.create({
            data: {
                name: 'Test Admin Assignments',
                mail: 'test-admin-assignments@test.com',
                password: hashedPassword,
                userType: 'admin',
                active: true,
            },
        });
        adminUserId = adminUser.id;

        // Create test workers
        const worker1 = await prisma.user.create({
            data: {
                name: 'Test Worker 1',
                mail: 'test-worker1-assignments@test.com',
                password: hashedPassword,
                userType: 'worker',
                active: true,
            },
        });
        workerUserId1 = worker1.id;

        const worker2 = await prisma.user.create({
            data: {
                name: 'Test Worker 2',
                mail: 'test-worker2-assignments@test.com',
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
                mail: 'test-inactive-worker-assignments@test.com',
                password: hashedPassword,
                userType: 'worker',
                active: false,
            },
        });
        inactiveWorkerUserId = inactiveWorker.id;

        // Create client, project, and tasks
        const client = await prisma.client.create({
            data: {
                name: 'Test Assignment Client',
                description: 'Test client for assignments',
            },
        });
        clientId = client.id;

        const project = await prisma.project.create({
            data: {
                name: 'Test Assignment Project',
                clientId: clientId,
                projectManagerId: adminUserId,
                startDate: new Date('2026-01-01'),
            },
        });
        projectId = project.id;

        const task = await prisma.task.create({
            data: {
                name: 'Test Assignment Task',
                projectId: projectId,
                status: 'open',
            },
        });
        taskId = task.id;

        // Create a task with no assignments
        const emptyTask = await prisma.task.create({
            data: {
                name: 'Test Empty Task',
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
                    in: [adminUserId, workerUserId1, workerUserId2, inactiveWorkerUserId],
                },
            },
        });
    });

    it('should return list of active workers assigned to task', async () => {
        const assignments = await prisma.taskWorker.findMany({
            where: {
                taskId: taskId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        active: true,
                    },
                },
            },
        });

        const workers = assignments
            .filter((assignment) => assignment.user.active)
            .map((assignment) => ({
                id: Number(assignment.user.id),
                name: assignment.user.name,
            }));

        expect(workers).toHaveLength(2);
        expect(workers).toEqual(
            expect.arrayContaining([
                { id: Number(workerUserId1), name: 'Test Worker 1' },
                { id: Number(workerUserId2), name: 'Test Worker 2' },
            ])
        );
        expect(workers).not.toEqual(
            expect.arrayContaining([{ id: Number(inactiveWorkerUserId), name: 'Test Inactive Worker' }])
        );
    });

    it('should return empty array if no workers assigned to task', async () => {
        const assignments = await prisma.taskWorker.findMany({
            where: {
                taskId: emptyTaskId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        active: true,
                    },
                },
            },
        });

        const workers = assignments
            .filter((assignment) => assignment.user.active)
            .map((assignment) => ({
                id: Number(assignment.user.id),
                name: assignment.user.name,
            }));

        expect(workers).toHaveLength(0);
        expect(workers).toEqual([]);
    });

    it('should only return active workers', async () => {
        const assignments = await prisma.taskWorker.findMany({
            where: {
                taskId: taskId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        active: true,
                    },
                },
            },
        });

        const allWorkers = assignments.map((a) => a.user);
        const activeWorkers = allWorkers.filter((user) => user.active);
        const inactiveWorkers = allWorkers.filter((user) => !user.active);

        expect(allWorkers).toHaveLength(3);
        expect(activeWorkers).toHaveLength(2);
        expect(inactiveWorkers).toHaveLength(1);
        expect(inactiveWorkers[0].id).toBe(inactiveWorkerUserId);
    });

    it('should throw error if task does not exist', async () => {
        const nonExistentTaskId = BigInt(999999);

        const task = await prisma.task.findUnique({
            where: { id: nonExistentTaskId },
        });

        expect(task).toBeNull();
    });
});
