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

describe('Attendance API Integration Tests', () => {
  beforeAll(async () => {
    // Create test user with correct schema fields
    const user = await prisma.user.create({
      data: {
        mail: `test-attendance-${Date.now()}@example.com`,
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

    // Create test project (requires projectManagerId and startDate)
    const project = await prisma.project.create({
      data: {
        name: `Test Project ${Date.now()}`,
        clientId: testClientId,
        projectManagerId: testUserId,
        startDate: new Date('2026-01-01'),
        active: true,
      },
    });
    testProjectId = project.id;

    // Create test task (no 'active' field, uses 'status')
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
    // Clean up attendance records for test user before each test
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
  });

  afterAll(async () => {
    // Clean up all test data in correct order (reverse dependency order)
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
  // POST /api/attendance - Create Attendance
  // ============================================================================

  describe('POST /api/attendance', () => {
    it('should create attendance with valid work status and times', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
    });

    it('should create attendance with sickness status (no times required)', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-21',
          status: 'sickness',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should create attendance with dayOff status', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-22',
          status: 'dayOff',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject work status without start/end times', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Start time and end time are required');
    });

    it('should reject when endTime <= startTime', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '17:00',
          endTime: '09:00',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('End time must be after start time');
    });

    it('should reject when endTime equals startTime', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '09:00',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('End time must be after start time');
    });

    it('should reject invalid time format', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '9:00', // Invalid - single digit hour
          endTime: '17:00',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'invalid_status',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Overlap Rejection Tests
  // ============================================================================

  describe('Overlap rejection on same date', () => {
    beforeEach(async () => {
      // Create an existing attendance record
      await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-25'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 14, 0, 0)),
          status: 'work',
        },
      });
    });

    it('should reject overlapping attendance (new starts during existing)', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '12:00',
          endTime: '16:00',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('overlaps');
    });

    it('should reject overlapping attendance (new contains existing)', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '08:00',
          endTime: '16:00',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('overlaps');
    });

    it('should reject overlapping attendance (new inside existing)', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '10:00',
          endTime: '12:00',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('overlaps');
    });

    it('should allow non-overlapping attendance (after existing)', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '16:00',
          endTime: '18:00',
          status: 'work',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow adjacent attendance (starts when existing ends)', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '14:00',
          endTime: '18:00',
          status: 'work',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow attendance on different date', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-26', // Different date
          startTime: '09:00',
          endTime: '14:00',
          status: 'work',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================================
  // PUT /api/attendance/:id - Update Attendance
  // ============================================================================

  describe('PUT /api/attendance/:id', () => {
    let existingAttendanceId: bigint;

    beforeEach(async () => {
      // Create attendance record to update
      const attendance = await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-28'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
          status: 'work',
        },
      });
      existingAttendanceId = attendance.id;
    });

    it('should update attendance times successfully', async () => {
      // First add enough time logs to cover the new duration
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: existingAttendanceId,
          taskId: testTaskId,
          durationMin: 480, // 8 hours
          location: 'office',
        },
      });

      const response = await request(app)
        .put(`/api/attendance/${existingAttendanceId}`)
        .send({
          startTime: '08:00',
          endTime: '16:00',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBe(true);
    });

    it('should update attendance status successfully', async () => {
      const response = await request(app)
        .put(`/api/attendance/${existingAttendanceId}`)
        .send({
          status: 'sickness',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject update with endTime <= startTime', async () => {
      const response = await request(app)
        .put(`/api/attendance/${existingAttendanceId}`)
        .send({
          startTime: '17:00',
          endTime: '09:00',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('End time must be after start time');
    });

    it('should reject update if it creates overlap with another record', async () => {
      // Create another attendance on same date
      await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-28'),
          startTime: new Date(Date.UTC(1970, 0, 1, 18, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 20, 0, 0)),
          status: 'work',
        },
      });

      // Add time logs to cover the extended duration
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: existingAttendanceId,
          taskId: testTaskId,
          durationMin: 600, // 10 hours to cover extended time
          location: 'office',
        },
      });

      // Try to extend first attendance to overlap with second
      const response = await request(app)
        .put(`/api/attendance/${existingAttendanceId}`)
        .send({
          endTime: '19:00', // Would overlap with 18:00-20:00
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('overlaps');
    });

    it('should reject updating date field', async () => {
      const response = await request(app)
        .put(`/api/attendance/${existingAttendanceId}`)
        .send({
          date: '2026-01-30',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Date cannot be changed');
    });

    it('should return 404 for non-existent attendance', async () => {
      const response = await request(app)
        .put('/api/attendance/999999')
        .send({
          status: 'sickness',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // Duration vs Logs Rejection Tests
  // ============================================================================

  describe('Duration vs Logs validation on update', () => {
    let attendanceWithLogsId: bigint;

    beforeEach(async () => {
      // Create attendance with 8 hour duration (480 minutes)
      const attendance = await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-30'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
          status: 'work',
        },
      });
      attendanceWithLogsId = attendance.id;

      // Create time logs totaling 4 hours (240 minutes)
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: attendanceWithLogsId,
          taskId: testTaskId,
          durationMin: 240,
          location: 'office',
        },
      });
    });

    it('should allow shortening time range when logs cover new duration', async () => {
      // Shorten to 2 hours (120 minutes) - logs (240) >= new duration (120) → PASS
      const response = await request(app)
        .put(`/api/attendance/${attendanceWithLogsId}`)
        .send({
          startTime: '09:00',
          endTime: '11:00', // 2 hours = 120 minutes
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow shortening to exact log duration', async () => {
      // Shorten to 4 hours (240 minutes) - logs (240) >= duration (240) → PASS
      const response = await request(app)
        .put(`/api/attendance/${attendanceWithLogsId}`)
        .send({
          startTime: '09:00',
          endTime: '13:00', // 4 hours = 240 minutes
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject extending time range when logs are insufficient', async () => {
      // Extend to 10 hours (600 minutes) - logs (240) < duration (600) → FAIL
      const response = await request(app)
        .put(`/api/attendance/${attendanceWithLogsId}`)
        .send({
          startTime: '07:00',
          endTime: '17:00', // 10 hours = 600 minutes
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('must be >= attendance duration');
    });

    it('should allow status change without time change (no duration check)', async () => {
      const response = await request(app)
        .put(`/api/attendance/${attendanceWithLogsId}`)
        .send({
          status: 'work',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow time change if logs cover the duration', async () => {
      // Add more logs to cover longer duration
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: attendanceWithLogsId,
          taskId: testTaskId,
          durationMin: 360, // Total now 600 minutes
          location: 'home',
        },
      });

      // Now extend to 10 hours - logs (600) >= duration (600) → PASS
      const response = await request(app)
        .put(`/api/attendance/${attendanceWithLogsId}`)
        .send({
          startTime: '07:00',
          endTime: '17:00', // 10 hours = 600 minutes
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================================
  // GET /api/attendance/month-history Tests
  // ============================================================================

  describe('GET /api/attendance/month-history', () => {
    beforeEach(async () => {
      // Create multiple attendance records in January
      await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-15'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
          status: 'work',
        },
      });

      await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-16'),
          status: 'sickness',
        },
      });
    });

    it('should return attendance records for specified month', async () => {
      const response = await request(app)
        .get('/api/attendance/month-history')
        .query({
          month: '1',
          userId: testUserId.toString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for month with no records', async () => {
      const response = await request(app)
        .get('/api/attendance/month-history')
        .query({
          month: '12', // December - no records
          userId: testUserId.toString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should format times as HH:mm strings', async () => {
      const response = await request(app)
        .get('/api/attendance/month-history')
        .query({
          month: '1',
          userId: testUserId.toString(),
        });

      expect(response.status).toBe(200);
      const workRecord = response.body.data.find((r: { status: string }) => r.status === 'work');
      expect(workRecord.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(workRecord.endTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should reject invalid month (0)', async () => {
      const response = await request(app)
        .get('/api/attendance/month-history')
        .query({
          month: '0',
          userId: testUserId.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid month (13)', async () => {
      const response = await request(app)
        .get('/api/attendance/month-history')
        .query({
          month: '13',
          userId: testUserId.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing userId', async () => {
      const response = await request(app)
        .get('/api/attendance/month-history')
        .query({
          month: '1',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing month', async () => {
      const response = await request(app)
        .get('/api/attendance/month-history')
        .query({
          userId: testUserId.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
