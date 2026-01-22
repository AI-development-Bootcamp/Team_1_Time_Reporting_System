import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp();

describe('Project Selector API Integration Tests', () => {
  let testUserId: bigint;
  let testClientId: bigint;
  let testClient2Id: bigint;
  let testProjectId: bigint;
  let testProject2Id: bigint;
  let testTaskId: bigint;
  let testTask2Id: bigint;
  let testTask3Id: bigint;

  // Track created IDs for cleanup
  const createdAttendanceIds: bigint[] = [];
  const createdTimeLogIds: bigint[] = [];

  beforeAll(async () => {
    // NOTE: We do NOT clean up all data - only create our own test data
    // This allows tests to run in parallel without interfering with each other

    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Project Selector Test User',
        mail: `project-selector-test-${Date.now()}@test.com`,
        password: 'hashedpassword',
        userType: 'worker',
        active: true,
      },
    });
    testUserId = user.id;

    // Create test clients
    const client1 = await prisma.client.create({
      data: {
        name: 'Alpha Client',
        active: true,
      },
    });
    testClientId = client1.id;

    const client2 = await prisma.client.create({
      data: {
        name: 'Beta Client',
        active: true,
      },
    });
    testClient2Id = client2.id;

    // Create test projects
    const project1 = await prisma.project.create({
      data: {
        name: 'Project One',
        clientId: testClientId,
        projectManagerId: testUserId,
        startDate: new Date('2026-01-01'),
        reportingType: 'duration',
        active: true,
      },
    });
    testProjectId = project1.id;

    const project2 = await prisma.project.create({
      data: {
        name: 'Project Two',
        clientId: testClient2Id,
        projectManagerId: testUserId,
        startDate: new Date('2026-01-01'),
        reportingType: 'startEnd',
        active: true,
      },
    });
    testProject2Id = project2.id;

    // Create test tasks
    const task1 = await prisma.task.create({
      data: {
        name: 'Task Alpha',
        projectId: testProjectId,
        status: 'open',
      },
    });
    testTaskId = task1.id;

    const task2 = await prisma.task.create({
      data: {
        name: 'Task Beta',
        projectId: testProjectId,
        status: 'open',
      },
    });
    testTask2Id = task2.id;

    const task3 = await prisma.task.create({
      data: {
        name: 'Task Gamma',
        projectId: testProject2Id,
        status: 'open',
      },
    });
    testTask3Id = task3.id;

    // Assign user to tasks
    await prisma.taskWorker.createMany({
      data: [
        { taskId: testTaskId, userId: testUserId },
        { taskId: testTask2Id, userId: testUserId },
        { taskId: testTask3Id, userId: testUserId },
      ],
    });
  });

  afterAll(async () => {
    // Clean up only OUR test data (in reverse order of creation due to FK constraints)
    if (createdTimeLogIds.length > 0) {
      await prisma.projectTimeLogs.deleteMany({
        where: { id: { in: createdTimeLogIds } },
      });
    }
    if (createdAttendanceIds.length > 0) {
      await prisma.dailyAttendance.deleteMany({
        where: { id: { in: createdAttendanceIds } },
      });
    }
    await prisma.taskWorker.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.task.deleteMany({
      where: { id: { in: [testTaskId, testTask2Id, testTask3Id] } },
    });
    await prisma.project.deleteMany({
      where: { id: { in: [testProjectId, testProject2Id] } },
    });
    await prisma.client.deleteMany({
      where: { id: { in: [testClientId, testClient2Id] } },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  // ============================================================================
  // GET /api/projects/selector - Basic Functionality
  // ============================================================================

  describe('GET /api/projects/selector', () => {
    it('should return grouped projects for user', async () => {
      const response = await request(app)
        .get('/api/projects/selector')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toBeDefined();
      expect(Array.isArray(response.body.data.clients)).toBe(true);
    });

    it('should include client/project/task structure', async () => {
      const response = await request(app)
        .get('/api/projects/selector')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      
      const { clients } = response.body.data;
      expect(clients.length).toBeGreaterThan(0);

      // Check client structure
      const client = clients[0];
      expect(client.id).toBeDefined();
      expect(client.name).toBeDefined();
      expect(client.reportCount).toBeDefined();
      expect(client.projects).toBeDefined();
      expect(Array.isArray(client.projects)).toBe(true);

      // Check project structure
      const project = client.projects[0];
      expect(project.id).toBeDefined();
      expect(project.name).toBeDefined();
      expect(project.reportingType).toBeDefined();
      expect(project.reportCount).toBeDefined();
      expect(project.tasks).toBeDefined();
      expect(Array.isArray(project.tasks)).toBe(true);

      // Check task structure
      const task = project.tasks[0];
      expect(task.id).toBeDefined();
      expect(task.name).toBeDefined();
      expect(task.reportCount).toBeDefined();
    });

    it('should return empty clients array for user with no assignments', async () => {
      // Create a user with no task assignments
      const noAssignmentsUser = await prisma.user.create({
        data: {
          name: 'No Assignments User',
          mail: `no-assignments-${Date.now()}@test.com`,
          password: 'hashedpassword',
          userType: 'worker',
          active: true,
        },
      });

      const response = await request(app)
        .get('/api/projects/selector')
        .query({ userId: noAssignmentsUser.id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data.clients).toEqual([]);

      // Clean up
      await prisma.user.delete({ where: { id: noAssignmentsUser.id } });
    });

    it('should reject request without userId', async () => {
      const response = await request(app)
        .get('/api/projects/selector');

      expect(response.status).toBe(400);
    });
  });

  // ============================================================================
  // Frequency Ordering Tests
  // ============================================================================

  describe('Frequency-based ordering', () => {
    it('should order by report count (most reported first)', async () => {
      // Create attendance records with time logs to establish frequency
      const attendance1 = await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-15'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
          status: 'work',
        },
      });
      createdAttendanceIds.push(attendance1.id);

      // Add 5 time logs for Task Beta (testTask2Id)
      for (let i = 0; i < 5; i++) {
        const log = await prisma.projectTimeLogs.create({
          data: { dailyAttendanceId: attendance1.id, taskId: testTask2Id, durationMin: 60, location: 'office' },
        });
        createdTimeLogIds.push(log.id);
      }

      // Add 2 time logs for Task Alpha (testTaskId)
      for (let i = 0; i < 2; i++) {
        const log = await prisma.projectTimeLogs.create({
          data: { dailyAttendanceId: attendance1.id, taskId: testTaskId, durationMin: 60, location: 'office' },
        });
        createdTimeLogIds.push(log.id);
      }

      const response = await request(app)
        .get('/api/projects/selector')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      
      // Find the project with both tasks
      const alphaClient = response.body.data.clients.find(
        (c: { id: string }) => c.id === testClientId.toString()
      );
      expect(alphaClient).toBeDefined();
      
      const projectOne = alphaClient.projects.find(
        (p: { id: string }) => p.id === testProjectId.toString()
      );
      expect(projectOne).toBeDefined();

      // Task Beta (5 reports) should come before Task Alpha (2 reports)
      const taskBetaIndex = projectOne.tasks.findIndex(
        (t: { id: string }) => t.id === testTask2Id.toString()
      );
      const taskAlphaIndex = projectOne.tasks.findIndex(
        (t: { id: string }) => t.id === testTaskId.toString()
      );

      expect(taskBetaIndex).toBeLessThan(taskAlphaIndex);
      expect(projectOne.tasks[taskBetaIndex].reportCount).toBe(5);
      expect(projectOne.tasks[taskAlphaIndex].reportCount).toBe(2);
    });

    it('should use alphabetical order for tie-breaker', async () => {
      // Clear our created logs first
      if (createdTimeLogIds.length > 0) {
        await prisma.projectTimeLogs.deleteMany({
          where: { id: { in: createdTimeLogIds } },
        });
        createdTimeLogIds.length = 0; // Clear the array
      }
      if (createdAttendanceIds.length > 0) {
        await prisma.dailyAttendance.deleteMany({
          where: { id: { in: createdAttendanceIds } },
        });
        createdAttendanceIds.length = 0; // Clear the array
      }
      // Both clients now have 0 reports - should be alphabetical
      const response = await request(app)
        .get('/api/projects/selector')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      
      const clientNames = response.body.data.clients.map((c: { name: string }) => c.name);
      // Alpha Client should come before Beta Client (alphabetical)
      const alphaIndex = clientNames.indexOf('Alpha Client');
      const betaIndex = clientNames.indexOf('Beta Client');
      
      expect(alphaIndex).toBeLessThan(betaIndex);
    });
  });

  // ============================================================================
  // Active Status Filtering Tests
  // ============================================================================

  describe('Active status filtering', () => {
    it('should exclude closed tasks', async () => {
      // Create a closed task and assign user
      const closedTask = await prisma.task.create({
        data: {
          name: 'Closed Task',
          projectId: testProjectId,
          status: 'closed',
        },
      });

      await prisma.taskWorker.create({
        data: {
          taskId: closedTask.id,
          userId: testUserId,
        },
      });

      const response = await request(app)
        .get('/api/projects/selector')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      
      // Check that closed task is not in response
      const allTasks = response.body.data.clients.flatMap(
        (c: { projects: { tasks: { name: string }[] }[] }) =>
          c.projects.flatMap((p) => p.tasks.map((t) => t.name))
      );
      expect(allTasks).not.toContain('Closed Task');

      // Clean up
      await prisma.taskWorker.delete({
        where: {
          taskId_userId: { taskId: closedTask.id, userId: testUserId },
        },
      });
      await prisma.task.delete({ where: { id: closedTask.id } });
    });

    it('should exclude inactive projects', async () => {
      // Create inactive project with task
      const inactiveProject = await prisma.project.create({
        data: {
          name: 'Inactive Project',
          clientId: testClientId,
          projectManagerId: testUserId,
          startDate: new Date('2026-01-01'),
          reportingType: 'duration',
          active: false,
        },
      });

      const taskInInactiveProject = await prisma.task.create({
        data: {
          name: 'Task In Inactive Project',
          projectId: inactiveProject.id,
          status: 'open',
        },
      });

      await prisma.taskWorker.create({
        data: {
          taskId: taskInInactiveProject.id,
          userId: testUserId,
        },
      });

      const response = await request(app)
        .get('/api/projects/selector')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      
      // Check that inactive project is not in response
      const allProjects = response.body.data.clients.flatMap(
        (c: { projects: { name: string }[] }) => c.projects.map((p) => p.name)
      );
      expect(allProjects).not.toContain('Inactive Project');

      // Clean up
      await prisma.taskWorker.delete({
        where: {
          taskId_userId: { taskId: taskInInactiveProject.id, userId: testUserId },
        },
      });
      await prisma.task.delete({ where: { id: taskInInactiveProject.id } });
      await prisma.project.delete({ where: { id: inactiveProject.id } });
    });

    it('should exclude inactive clients', async () => {
      // Create inactive client with project and task
      const inactiveClient = await prisma.client.create({
        data: {
          name: 'Inactive Client',
          active: false,
        },
      });

      const projectInInactiveClient = await prisma.project.create({
        data: {
          name: 'Project In Inactive Client',
          clientId: inactiveClient.id,
          projectManagerId: testUserId,
          startDate: new Date('2026-01-01'),
          reportingType: 'duration',
          active: true,
        },
      });

      const taskInInactiveClient = await prisma.task.create({
        data: {
          name: 'Task In Inactive Client',
          projectId: projectInInactiveClient.id,
          status: 'open',
        },
      });

      await prisma.taskWorker.create({
        data: {
          taskId: taskInInactiveClient.id,
          userId: testUserId,
        },
      });

      const response = await request(app)
        .get('/api/projects/selector')
        .query({ userId: testUserId.toString() });

      expect(response.status).toBe(200);
      
      // Check that inactive client is not in response
      const allClients = response.body.data.clients.map((c: { name: string }) => c.name);
      expect(allClients).not.toContain('Inactive Client');

      // Clean up
      await prisma.taskWorker.delete({
        where: {
          taskId_userId: { taskId: taskInInactiveClient.id, userId: testUserId },
        },
      });
      await prisma.task.delete({ where: { id: taskInInactiveClient.id } });
      await prisma.project.delete({ where: { id: projectInInactiveClient.id } });
      await prisma.client.delete({ where: { id: inactiveClient.id } });
    });
  });

});
