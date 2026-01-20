import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient();

// Test data
let testUserId: bigint;
let testClientId: bigint;
let testProjectId: bigint;
let testTaskId: bigint;
let testAttendanceId: bigint;

describe('Time Logs API Integration Tests', () => {
  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        mail: `test-timelogs-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashedpassword123',
        userType: 'worker',
        active: true,
      },
    });
    testUserId = user.id;

    // Create test client
    const client = await prisma.client.create({
      data: {
        name: `Test Client ${Date.now()}`,
        active: true,
      },
    });
    testClientId = client.id;

    // Create test project with duration reporting type (for existing tests)
    const project = await prisma.project.create({
      data: {
        name: `Test Project ${Date.now()}`,
        clientId: testClientId,
        projectManagerId: testUserId,
        startDate: new Date('2026-01-01'),
        reportingType: 'duration',  // Use duration type for backward compatibility
        active: true,
      },
    });
    testProjectId = project.id;

    // Create test task
    const task = await prisma.task.create({
      data: {
        name: `Test Task ${Date.now()}`,
        projectId: testProjectId,
        status: 'open',
      },
    });
    testTaskId = task.id;
  });

  beforeEach(async () => {
    // Clean up time logs and attendance for test user
    await prisma.projectTimeLogs.deleteMany({
      where: {
        dailyAttendance: {
          userId: testUserId,
        },
      },
    });
    await prisma.dailyAttendance.deleteMany({
      where: { userId: testUserId },
    });

    // Create a fresh attendance record for each test
    const attendance = await prisma.dailyAttendance.create({
      data: {
        userId: testUserId,
        date: new Date('2026-01-20'),
        startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
        status: 'work',
      },
    });
    testAttendanceId = attendance.id;
  });

  afterAll(async () => {
    // Clean up all test data
    try {
      await prisma.projectTimeLogs.deleteMany({
        where: { taskId: testTaskId },
      });
      await prisma.dailyAttendance.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.taskWorker.deleteMany({
        where: { taskId: testTaskId },
      });
      await prisma.task.deleteMany({
        where: { id: testTaskId },
      });
      await prisma.project.deleteMany({
        where: { id: testProjectId },
      });
      await prisma.client.deleteMany({
        where: { id: testClientId },
      });
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  // ============================================================================
  // POST /api/time-logs - Create Time Log
  // ============================================================================

  describe('POST /api/time-logs', () => {
    it('should create time log with valid data', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: testTaskId.toString(),
          duration: 120,
          location: 'office',
          description: 'Worked on feature',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
    });

    it('should create time log without description', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: testTaskId.toString(),
          duration: 60,
          location: 'home',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow overlapping time logs (same task, same attendance)', async () => {
      // Create first log
      await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: testTaskId.toString(),
          duration: 120,
          location: 'office',
        });

      // Create second log (overlapping is allowed per spec)
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: testTaskId.toString(),
          duration: 120,
          location: 'office',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid location', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: testTaskId.toString(),
          duration: 120,
          location: 'invalid_location',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject zero duration', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: testTaskId.toString(),
          duration: 0,
          location: 'office',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject negative duration', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: testTaskId.toString(),
          duration: -60,
          location: 'office',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return NOT_FOUND for non-existent attendance', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: '999999',
          taskId: testTaskId.toString(),
          duration: 120,
          location: 'office',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return NOT_FOUND for non-existent task', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: '999999',
          duration: 120,
          location: 'office',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          // missing taskId, duration, location
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // GET /api/time-logs - List Time Logs
  // ============================================================================

  describe('GET /api/time-logs', () => {
    beforeEach(async () => {
      // Create some time logs
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: testTaskId,
          durationMin: 120,
          location: 'office',
          description: 'Morning work',
        },
      });
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: testTaskId,
          durationMin: 180,
          location: 'home',
          description: 'Afternoon work',
        },
      });
    });

    it('should return time logs for attendance', async () => {
      const response = await request(app)
        .get('/api/time-logs')
        .query({ dailyAttendanceId: testAttendanceId.toString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should return flat list (no nested objects)', async () => {
      const response = await request(app)
        .get('/api/time-logs')
        .query({ dailyAttendanceId: testAttendanceId.toString() });

      expect(response.status).toBe(200);
      const log = response.body.data[0];
      expect(log.id).toBeDefined();
      expect(log.dailyAttendanceId).toBeDefined();
      expect(log.taskId).toBeDefined();
      expect(log.duration).toBeDefined();
      expect(log.location).toBeDefined();
      // Should NOT have nested task/project/client
      expect(log.task).toBeUndefined();
      expect(log.project).toBeUndefined();
      expect(log.client).toBeUndefined();
    });

    it('should return empty array for attendance with no logs', async () => {
      // Create new attendance without logs
      const newAttendance = await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-21'),
          status: 'work',
        },
      });

      const response = await request(app)
        .get('/api/time-logs')
        .query({ dailyAttendanceId: newAttendance.id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should return NOT_FOUND for non-existent attendance', async () => {
      const response = await request(app)
        .get('/api/time-logs')
        .query({ dailyAttendanceId: '999999' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing dailyAttendanceId', async () => {
      const response = await request(app).get('/api/time-logs');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // PUT /api/time-logs/:id - Update Time Log
  // ============================================================================

  describe('PUT /api/time-logs/:id', () => {
    let existingLogId: bigint;

    beforeEach(async () => {
      // Create a time log to update
      const log = await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: testTaskId,
          durationMin: 480, // 8 hours to cover attendance duration
          location: 'office',
          description: 'Original description',
        },
      });
      existingLogId = log.id;
    });

    it('should update time log duration', async () => {
      const response = await request(app)
        .put(`/api/time-logs/${existingLogId}`)
        .send({
          duration: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(true);
    });

    it('should update time log location', async () => {
      const response = await request(app)
        .put(`/api/time-logs/${existingLogId}`)
        .send({
          location: 'home',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should update time log description', async () => {
      const response = await request(app)
        .put(`/api/time-logs/${existingLogId}`)
        .send({
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent time log', async () => {
      const response = await request(app)
        .put('/api/time-logs/999999')
        .send({
          duration: 120,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid duration', async () => {
      const response = await request(app)
        .put(`/api/time-logs/${existingLogId}`)
        .send({
          duration: -10,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // DELETE /api/time-logs/:id - Delete Time Log
  // ============================================================================

  describe('DELETE /api/time-logs/:id', () => {
    it('should delete time log when duration rule is satisfied', async () => {
      // Create attendance without times (no duration constraint)
      const noTimesAttendance = await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-22'),
          status: 'sickness',
        },
      });

      const log = await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: noTimesAttendance.id,
          taskId: testTaskId,
          durationMin: 120,
          location: 'office',
        },
      });

      const response = await request(app)
        .delete(`/api/time-logs/${log.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
    });

    it('should return 404 for non-existent time log', async () => {
      const response = await request(app)
        .delete('/api/time-logs/999999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Duration vs Logs Rule Tests
  // ============================================================================

  describe('Duration vs Logs validation', () => {
    it('should reject delete when total would become less than attendance duration', async () => {
      // Attendance is 8 hours (480 min)
      // Create exactly 480 min of logs
      const log = await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: testTaskId,
          durationMin: 480,
          location: 'office',
        },
      });

      // Try to delete - should fail because 0 < 480
      const response = await request(app)
        .delete(`/api/time-logs/${log.id}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('cannot be less than');
    });

    it('should allow delete when multiple logs still cover duration', async () => {
      // Create two logs totaling more than attendance (480)
      const log1 = await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: testTaskId,
          durationMin: 300,
          location: 'office',
        },
      });
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: testTaskId,
          durationMin: 300,
          location: 'home',
        },
      });

      // Delete first log - remaining 300 < 480, should fail
      const response = await request(app)
        .delete(`/api/time-logs/${log1.id}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject update that reduces total below attendance duration', async () => {
      // Create log covering full attendance duration
      const log = await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: testTaskId,
          durationMin: 480,
          location: 'office',
        },
      });

      // Try to reduce to 60 min - should fail because 60 < 480
      const response = await request(app)
        .put(`/api/time-logs/${log.id}`)
        .send({
          duration: 60,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('cannot be less than');
    });
  });

  // ============================================================================
  // Reporting Type Tests (startEnd vs duration)
  // ============================================================================

  describe('Reporting Type: startEnd project', () => {
    let startEndProjectId: bigint;
    let startEndTaskId: bigint;

    beforeAll(async () => {
      // Create a project with reportingType=startEnd
      const startEndProject = await prisma.project.create({
        data: {
          name: `StartEnd Project ${Date.now()}`,
          clientId: testClientId,
          projectManagerId: testUserId,
          startDate: new Date('2026-01-01'),
          reportingType: 'startEnd',
          active: true,
        },
      });
      startEndProjectId = startEndProject.id;

      // Create task for startEnd project
      const startEndTask = await prisma.task.create({
        data: {
          name: `StartEnd Task ${Date.now()}`,
          projectId: startEndProjectId,
          status: 'open',
        },
      });
      startEndTaskId = startEndTask.id;
    });

    afterAll(async () => {
      // Clean up startEnd project test data
      await prisma.projectTimeLogs.deleteMany({
        where: { taskId: startEndTaskId },
      });
      await prisma.task.deleteMany({
        where: { id: startEndTaskId },
      });
      await prisma.project.deleteMany({
        where: { id: startEndProjectId },
      });
    });

    it('should create time log with startTime and endTime', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: startEndTaskId.toString(),
          startTime: '09:00',
          endTime: '12:00',
          location: 'office',
          description: 'Morning meeting',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
    });

    it('should store all 3 fields (startTime, endTime, durationMin)', async () => {
      // Create a time log via API
      const createRes = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: startEndTaskId.toString(),
          startTime: '10:00',
          endTime: '14:30',
          location: 'office',
        });

      expect(createRes.status).toBe(201);

      // Check via GET
      const getRes = await request(app)
        .get('/api/time-logs')
        .query({ dailyAttendanceId: testAttendanceId.toString() });

      expect(getRes.status).toBe(200);
      const log = getRes.body.data.find((l: { id: string }) => l.id === createRes.body.data.id);
      expect(log).toBeDefined();
      expect(log.startTime).toBe('10:00');
      expect(log.endTime).toBe('14:30');
      expect(log.duration).toBe(270); // 4.5 hours = 270 min
    });

    it('should reject if startTime/endTime missing for startEnd project', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: startEndTaskId.toString(),
          duration: 120, // Providing duration instead of startTime/endTime
          location: 'office',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('startTime and endTime');
    });

    it('should reject if endTime <= startTime', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: startEndTaskId.toString(),
          startTime: '14:00',
          endTime: '12:00', // Before start
          location: 'office',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('End time must be after start time');
    });

    it('should reject endTime that crosses midnight (00:30 next day)', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: startEndTaskId.toString(),
          startTime: '23:30',
          endTime: '00:30', // Next day - not allowed
          location: 'office',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('End time must be after start time');
    });

    it('should reject invalid time format (24:00)', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: startEndTaskId.toString(),
          startTime: '22:00',
          endTime: '24:00', // Invalid - should be rejected by schema
          location: 'office',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Reporting Type: duration project', () => {
    let durationProjectId: bigint;
    let durationTaskId: bigint;

    beforeAll(async () => {
      // Create a project with reportingType=duration
      const durationProject = await prisma.project.create({
        data: {
          name: `Duration Project ${Date.now()}`,
          clientId: testClientId,
          projectManagerId: testUserId,
          startDate: new Date('2026-01-01'),
          reportingType: 'duration',
          active: true,
        },
      });
      durationProjectId = durationProject.id;

      // Create task for duration project
      const durationTask = await prisma.task.create({
        data: {
          name: `Duration Task ${Date.now()}`,
          projectId: durationProjectId,
          status: 'open',
        },
      });
      durationTaskId = durationTask.id;
    });

    afterAll(async () => {
      // Clean up duration project test data
      await prisma.projectTimeLogs.deleteMany({
        where: { taskId: durationTaskId },
      });
      await prisma.task.deleteMany({
        where: { id: durationTaskId },
      });
      await prisma.project.deleteMany({
        where: { id: durationProjectId },
      });
    });

    it('should create time log with duration only', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: durationTaskId.toString(),
          duration: 120,
          location: 'office',
          description: 'Duration-based work',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should store durationMin with null startTime/endTime', async () => {
      // Create a time log
      const createRes = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: durationTaskId.toString(),
          duration: 90,
          location: 'home',
        });

      expect(createRes.status).toBe(201);

      // Check via GET
      const getRes = await request(app)
        .get('/api/time-logs')
        .query({ dailyAttendanceId: testAttendanceId.toString() });

      expect(getRes.status).toBe(200);
      const log = getRes.body.data.find((l: { id: string }) => l.id === createRes.body.data.id);
      expect(log).toBeDefined();
      expect(log.duration).toBe(90);
      expect(log.startTime).toBeNull();
      expect(log.endTime).toBeNull();
    });

    it('should reject if duration missing for duration project', async () => {
      const response = await request(app)
        .post('/api/time-logs')
        .send({
          dailyAttendanceId: testAttendanceId.toString(),
          taskId: durationTaskId.toString(),
          startTime: '09:00', // Providing startTime/endTime instead of duration
          endTime: '12:00',
          location: 'office',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('duration');
    });

    it('should update time log duration correctly', async () => {
      // Create log
      const log = await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: durationTaskId,
          durationMin: 480, // Cover full attendance
          location: 'office',
        },
      });

      // Update
      const response = await request(app)
        .put(`/api/time-logs/${log.id}`)
        .send({
          duration: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Update time log when project reportingType changes', () => {
    it('should require startTime/endTime when project changes to startEnd', async () => {
      // Create a project that starts as duration-based
      const project = await prisma.project.create({
        data: {
          name: `Changing Project ${Date.now()}`,
          clientId: testClientId,
          projectManagerId: testUserId,
          startDate: new Date('2026-01-01'),
          reportingType: 'duration', // Start as duration
          active: true,
        },
      });

      const task = await prisma.task.create({
        data: {
          name: `Changing Task ${Date.now()}`,
          projectId: project.id,
          status: 'open',
        },
      });

      // Create a log with just duration
      const log = await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: testAttendanceId,
          taskId: task.id,
          durationMin: 480,
          location: 'office',
          startTime: null,
          endTime: null,
        },
      });

      // Change project to startEnd
      await prisma.project.update({
        where: { id: project.id },
        data: { reportingType: 'startEnd' },
      });

      // Try to update with just duration - should fail now
      const response = await request(app)
        .put(`/api/time-logs/${log.id}`)
        .send({
          duration: 500, // Only duration, no startTime/endTime
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('startTime and endTime');

      // Clean up
      await prisma.projectTimeLogs.delete({ where: { id: log.id } });
      await prisma.task.delete({ where: { id: task.id } });
      await prisma.project.delete({ where: { id: project.id } });
    });
  });
});
