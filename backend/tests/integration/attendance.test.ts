import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';

const prisma = new PrismaClient();
const app = createApp();

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
    // Using reportingType: duration for backward compatibility with existing tests
    const project = await prisma.project.create({
      data: {
        name: `Test Project ${Date.now()}`,
        clientId: testClientId,
        projectManagerId: testUserId,
        startDate: new Date('2026-01-01'),
        reportingType: 'duration',
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
    it('should reject work status and require combined endpoint', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('/api/attendance/combined');
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

    it('should reject work status without start/end times (requires combined endpoint)', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('/api/attendance/combined');
    });

    it('should reject work status with endTime <= startTime (requires combined endpoint)', async () => {
      // Work status is blocked at controller level first
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
      expect(response.body.error.message).toContain('/api/attendance/combined');
    });

    it('should reject work status when endTime equals startTime (requires combined endpoint)', async () => {
      // Work status is blocked at controller level first
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
      expect(response.body.error.message).toContain('/api/attendance/combined');
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

  describe('Overlap rejection on same date (via combined endpoint)', () => {
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
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '12:00',
          endTime: '16:00',
          status: 'work',
          timeLogs: [{ taskId: testTaskId.toString(), duration: 240, location: 'office' }],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('overlaps');
    });

    it('should reject overlapping attendance (new contains existing)', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '08:00',
          endTime: '16:00',
          status: 'work',
          timeLogs: [{ taskId: testTaskId.toString(), duration: 480, location: 'office' }],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('overlaps');
    });

    it('should reject overlapping attendance (new inside existing)', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '10:00',
          endTime: '12:00',
          status: 'work',
          timeLogs: [{ taskId: testTaskId.toString(), duration: 120, location: 'office' }],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('overlaps');
    });

    it('should allow non-overlapping attendance (after existing)', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '16:00',
          endTime: '18:00',
          status: 'work',
          timeLogs: [{ taskId: testTaskId.toString(), duration: 120, location: 'office' }],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow adjacent attendance (starts when existing ends)', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '14:00',
          endTime: '18:00',
          status: 'work',
          timeLogs: [{ taskId: testTaskId.toString(), duration: 240, location: 'office' }],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow attendance on different date', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-26', // Different date
          startTime: '09:00',
          endTime: '14:00',
          status: 'work',
          timeLogs: [{ taskId: testTaskId.toString(), duration: 300, location: 'office' }],
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

  // ============================================================================
  // POST /api/attendance/combined - Combined Attendance + Time Logs (Atomic)
  // ============================================================================

  describe('POST /api/attendance/combined', () => {
    it('should create attendance and time logs atomically', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 480, // 8 hours = attendance duration
              location: 'office',
              description: 'Full day work',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.attendanceId).toBeDefined();
      expect(response.body.data.timeLogIds).toBeDefined();
      expect(response.body.data.timeLogIds.length).toBe(1);
    });

    it('should create multiple time logs in one request', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 300, // 5 hours
              location: 'office',
              description: 'Morning work',
            },
            {
              taskId: testTaskId.toString(),
              duration: 180, // 3 hours
              location: 'home',
              description: 'Afternoon work',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.timeLogIds.length).toBe(2);
    });

    it('should reject if total time logs < attendance duration', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00', // 8 hours = 480 min
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 240, // Only 4 hours - not enough!
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('must be >= attendance duration');
    });

    it('should reject if endTime <= startTime', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '17:00',
          endTime: '09:00',
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 480,
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('End time must be after start time');
    });

    it('should reject if exclusive status exists on date', async () => {
      // Create dayOff first
      await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-21'),
          status: 'dayOff',
        },
      });

      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-21',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 480,
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('exclusive status');
    });

    it('should reject if overlaps with existing work attendance', async () => {
      // Create existing work attendance
      await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-01-22'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 14, 0, 0)),
          status: 'work',
        },
      });

      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-22',
          startTime: '12:00', // Overlaps with 09:00-14:00
          endTime: '18:00',
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 360,
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('overlaps');
    });

    it('should reject if task does not exist', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: '999999', // Non-existent task
              duration: 480,
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toContain('Task not found');
    });

    it('should reject if no time logs provided', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [], // Empty array
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid location in time log', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 480,
              location: 'invalid_location',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should rollback everything if validation fails mid-transaction', async () => {
      // Try to create with invalid second time log (non-existent task)
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-23',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 240,
              location: 'office',
            },
            {
              taskId: '999999', // This will fail
              duration: 240,
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(404);

      // Verify no attendance was created (transaction rolled back)
      const attendance = await prisma.dailyAttendance.findFirst({
        where: {
          userId: testUserId,
          date: new Date('2026-01-23'),
        },
      });
      expect(attendance).toBeNull();
    });

    it('should allow time logs sum > attendance duration', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00', // 8 hours
          status: 'work',
          timeLogs: [
            {
              taskId: testTaskId.toString(),
              duration: 600, // 10 hours - more than attendance
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // ============================================================================
  // Combined Save with startEnd Project Type
  // ============================================================================

  describe('POST /api/attendance/combined with startEnd project', () => {
    let startEndProjectId: bigint;
    let startEndTaskId: bigint;

    beforeAll(async () => {
      // Create a project with reportingType=startEnd
      const project = await prisma.project.create({
        data: {
          name: `StartEnd Project Combined ${Date.now()}`,
          clientId: testClientId,
          projectManagerId: testUserId,
          startDate: new Date('2026-01-01'),
          reportingType: 'startEnd',
          active: true,
        },
      });
      startEndProjectId = project.id;

      const task = await prisma.task.create({
        data: {
          name: `StartEnd Task Combined ${Date.now()}`,
          projectId: startEndProjectId,
          status: 'open',
        },
      });
      startEndTaskId = task.id;
    });

    afterAll(async () => {
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

    it('should create combined with startEnd time log', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-24',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: startEndTaskId.toString(),
              startTime: '09:00',
              endTime: '17:00', // 8 hours
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject startEnd project without startTime/endTime', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: startEndTaskId.toString(),
              duration: 480, // Wrong! Should use startTime/endTime
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('startTime and endTime');
    });

    it('should reject startEnd time log with endTime <= startTime', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-01-25',
          startTime: '09:00',
          endTime: '17:00',
          status: 'work',
          timeLogs: [
            {
              taskId: startEndTaskId.toString(),
              startTime: '14:00',
              endTime: '10:00', // Invalid!
              location: 'office',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('End time must be after start time');
    });
  });

  // ============================================================================
  // Non-Work Status Handling Tests (TASK-M2-011C)
  // ============================================================================

  describe('Non-Work Status Handling', () => {
    describe('Exclusive status rules (dayOff/sickness/reserves)', () => {
      it('should create dayOff when no other attendance exists', async () => {
        const response = await request(app)
          .post('/api/attendance')
          .send({
            userId: testUserId.toString(),
            date: '2026-02-01',
            status: 'dayOff',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should create sickness without document (frontend shows badge)', async () => {
        const response = await request(app)
          .post('/api/attendance')
          .send({
            userId: testUserId.toString(),
            date: '2026-02-02',
            status: 'sickness',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should reject dayOff when work attendance exists', async () => {
        // Create work attendance first
        await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-03'),
            startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
            endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
            status: 'work',
          },
        });

        const response = await request(app)
          .post('/api/attendance')
          .send({
            userId: testUserId.toString(),
            date: '2026-02-03',
            status: 'dayOff',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('other attendance already exists');
      });

      it('should reject work when dayOff exists (via combined endpoint)', async () => {
        // Create dayOff first
        await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-04'),
            status: 'dayOff',
          },
        });

        const response = await request(app)
          .post('/api/attendance/combined')
          .send({
            userId: testUserId.toString(),
            date: '2026-02-04',
            startTime: '09:00',
            endTime: '17:00',
            status: 'work',
            timeLogs: [{ taskId: testTaskId.toString(), duration: 480, location: 'office' }],
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('exclusive status');
      });

      it('should reject sickness when halfDayOff exists', async () => {
        // Create halfDayOff first
        await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-05'),
            status: 'halfDayOff',
          },
        });

        const response = await request(app)
          .post('/api/attendance')
          .send({
            userId: testUserId.toString(),
            date: '2026-02-05',
            status: 'sickness',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('other attendance already exists');
      });
    });

    describe('halfDayOff coexistence rules', () => {
      it('should allow halfDayOff alongside work attendance', async () => {
        // Create work attendance first
        await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-10'),
            startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
            endTime: new Date(Date.UTC(1970, 0, 1, 13, 0, 0)),
            status: 'work',
          },
        });

        const response = await request(app)
          .post('/api/attendance')
          .send({
            userId: testUserId.toString(),
            date: '2026-02-10',
            status: 'halfDayOff',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should allow work alongside halfDayOff (via combined endpoint)', async () => {
        // Create halfDayOff first
        await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-11'),
            status: 'halfDayOff',
          },
        });

        const response = await request(app)
          .post('/api/attendance/combined')
          .send({
            userId: testUserId.toString(),
            date: '2026-02-11',
            startTime: '14:00',
            endTime: '18:00',
            status: 'work',
            timeLogs: [{ taskId: testTaskId.toString(), duration: 240, location: 'office' }],
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should reject halfDayOff when dayOff exists', async () => {
        // Create dayOff first
        await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-12'),
            status: 'dayOff',
          },
        });

        const response = await request(app)
          .post('/api/attendance')
          .send({
            userId: testUserId.toString(),
            date: '2026-02-12',
            status: 'halfDayOff',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('exclusive status');
      });
    });

    describe('Status change rules on update', () => {
      it('should block work→halfDayOff when time logs exist', async () => {
        // Create work attendance with time log
        const attendance = await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-15'),
            startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
            endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
            status: 'work',
          },
        });

        await prisma.projectTimeLogs.create({
          data: {
            dailyAttendanceId: attendance.id,
            taskId: testTaskId,
            durationMin: 480,
            location: 'office',
          },
        });

        const response = await request(app)
          .put(`/api/attendance/${attendance.id}`)
          .send({
            status: 'halfDayOff',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('time logs exist');
      });

      it('should allow work→halfDayOff after deleting time logs', async () => {
        // Create work attendance WITHOUT time logs
        const attendance = await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-16'),
            startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
            endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
            status: 'work',
          },
        });

        const response = await request(app)
          .put(`/api/attendance/${attendance.id}`)
          .send({
            status: 'halfDayOff',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should require times when changing halfDayOff→work', async () => {
        // Create halfDayOff
        const attendance = await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-17'),
            status: 'halfDayOff',
          },
        });

        const response = await request(app)
          .put(`/api/attendance/${attendance.id}`)
          .send({
            status: 'work',
            // Missing startTime and endTime!
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('Start time and end time are required');
      });

      it('should allow halfDayOff→work with times provided', async () => {
        // Create halfDayOff
        const attendance = await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-18'),
            status: 'halfDayOff',
          },
        });

        const response = await request(app)
          .put(`/api/attendance/${attendance.id}`)
          .send({
            status: 'work',
            startTime: '14:00',
            endTime: '18:00',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should block change to exclusive status when other attendance exists', async () => {
        // Create two attendances on same date
        const attendance1 = await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-19'),
            startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
            endTime: new Date(Date.UTC(1970, 0, 1, 13, 0, 0)),
            status: 'work',
          },
        });

        await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-19'),
            status: 'halfDayOff',
          },
        });

        // Try to change first to dayOff - should fail
        const response = await request(app)
          .put(`/api/attendance/${attendance1.id}`)
          .send({
            status: 'dayOff',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain('other attendance already exists');
      });

      it('should clear times when changing to non-work status', async () => {
        // Create work attendance
        const attendance = await prisma.dailyAttendance.create({
          data: {
            userId: testUserId,
            date: new Date('2026-02-20'),
            startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
            endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
            status: 'work',
          },
        });

        await request(app)
          .put(`/api/attendance/${attendance.id}`)
          .send({
            status: 'sickness',
          });

        // Verify times are cleared
        const updated = await prisma.dailyAttendance.findUnique({
          where: { id: attendance.id },
        });

        expect(updated?.status).toBe('sickness');
        expect(updated?.startTime).toBeNull();
        expect(updated?.endTime).toBeNull();
      });
    });
  });

  // ============================================================================
  // Time Validation Edge Cases (TASK-M2-011E)
  // ============================================================================

  describe('Time Validation Edge Cases', () => {
    it('should reject attendance with invalid time format (24:00)', async () => {
      const response = await request(app)
        .post('/api/attendance')
        .send({
          userId: testUserId.toString(),
          date: '2026-02-25',
          startTime: '22:00',
          endTime: '24:00', // Invalid - should be rejected
          status: 'work',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject update with endTime exceeding 23:59', async () => {
      // Create valid attendance first
      const attendance = await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-02-26'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 17, 0, 0)),
          status: 'work',
        },
      });

      // Add time logs to cover the duration
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: attendance.id,
          taskId: testTaskId,
          durationMin: 480,
          location: 'office',
        },
      });

      // Try to update with invalid time - schema should reject 24:00
      const response = await request(app)
        .put(`/api/attendance/${attendance.id}`)
        .send({
          endTime: '24:00', // Invalid
        });

      expect(response.status).toBe(400);
    });

    it('should accept attendance with max valid time (23:59) via combined endpoint', async () => {
      const response = await request(app)
        .post('/api/attendance/combined')
        .send({
          userId: testUserId.toString(),
          date: '2026-02-27',
          startTime: '22:00',
          endTime: '23:59', // Valid - max allowed
          status: 'work',
          timeLogs: [{ taskId: testTaskId.toString(), duration: 119, location: 'office' }],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject extending attendance when logs are insufficient', async () => {
      // Create attendance with 2 hours (120 min)
      const attendance = await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-02-28'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 11, 0, 0)), // 2 hours
          status: 'work',
        },
      });

      // Add time logs covering exactly 2 hours
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: attendance.id,
          taskId: testTaskId,
          durationMin: 120,
          location: 'office',
        },
      });

      // Try to extend to 4 hours - should fail (120 < 240)
      const response = await request(app)
        .put(`/api/attendance/${attendance.id}`)
        .send({
          endTime: '13:00', // 4 hours = 240 min
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('must be >= attendance duration');
    });

    it('should allow reducing attendance when logs are sufficient', async () => {
      // Create attendance with 4 hours (240 min)
      const attendance = await prisma.dailyAttendance.create({
        data: {
          userId: testUserId,
          date: new Date('2026-03-01'),
          startTime: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 13, 0, 0)), // 4 hours
          status: 'work',
        },
      });

      // Add time logs covering 4 hours
      await prisma.projectTimeLogs.create({
        data: {
          dailyAttendanceId: attendance.id,
          taskId: testTaskId,
          durationMin: 240,
          location: 'office',
        },
      });

      // Reduce to 2 hours - should succeed (240 >= 120)
      const response = await request(app)
        .put(`/api/attendance/${attendance.id}`)
        .send({
          endTime: '11:00', // 2 hours = 120 min
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
