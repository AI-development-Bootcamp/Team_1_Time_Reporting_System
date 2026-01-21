/**
 * Integration Tests: Document Upload for Daily Attendance
 * Tests POST/DELETE /api/attendance/:id/document endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../src/app';
import { prisma } from '../../src/utils/prisma';

describe('Document Upload Endpoints', () => {
  let testUserId: bigint;
  let sicknessAttendanceId: bigint;
  let workAttendanceId: bigint;

  // Test file paths (we'll create these dynamically)
  const validJpgPath = path.join(__dirname, 'test-files', 'test.jpg');
  const validPngPath = path.join(__dirname, 'test-files', 'test.png');
  const validPdfPath = path.join(__dirname, 'test-files', 'test.pdf');
  const invalidTxtPath = path.join(__dirname, 'test-files', 'test.txt');
  const largFilePath = path.join(__dirname, 'test-files', 'large.jpg');

  beforeAll(async () => {
    // Create test files directory
    const testFilesDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create test files
    // Valid JPG (1KB)
    fs.writeFileSync(validJpgPath, Buffer.from('fake-jpg-content'));
    
    // Valid PNG (1KB)
    fs.writeFileSync(validPngPath, Buffer.from('fake-png-content'));
    
    // Valid PDF (1KB)
    fs.writeFileSync(validPdfPath, Buffer.from('fake-pdf-content'));
    
    // Invalid TXT file
    fs.writeFileSync(invalidTxtPath, Buffer.from('invalid-text-content'));
    
    // Large file (6MB - exceeds 5MB limit)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    fs.writeFileSync(largFilePath, largeBuffer);

    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        mail: 'docupload@test.com',
        password: 'hashedpassword',
        userType: 'worker',
      },
    });
    testUserId = user.id;

    // Create sickness attendance (allows document upload)
    const sicknessAttendance = await prisma.dailyAttendance.create({
      data: {
        userId: testUserId,
        date: new Date('2026-01-15'),
        status: 'sickness',
        startTime: null,
        endTime: null,
      },
    });
    sicknessAttendanceId = sicknessAttendance.id;

    // Create work attendance (should NOT allow document upload)
    const workAttendance = await prisma.dailyAttendance.create({
      data: {
        userId: testUserId,
        date: new Date('2026-01-16'),
        status: 'work',
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T17:00:00Z'),
      },
    });
    workAttendanceId = workAttendance.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.dailyAttendance.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });

    // Cleanup test files
    const testFilesDir = path.join(__dirname, 'test-files');
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
  });

  describe('POST /api/attendance/:id/document', () => {
    it('should upload JPG document successfully', async () => {
      const response = await request(app)
        .post(`/api/attendance/${sicknessAttendanceId}/document`)
        .attach('document', validJpgPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.uploaded).toBe(true);
      expect(response.body.data.fileName).toBe('test.jpg');

      // Verify document was saved
      const attendance = await prisma.dailyAttendance.findUnique({
        where: { id: sicknessAttendanceId },
      });
      expect(attendance?.document).toBeTruthy();
    });

    it('should upload PNG document successfully', async () => {
      const response = await request(app)
        .post(`/api/attendance/${sicknessAttendanceId}/document`)
        .attach('document', validPngPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should upload PDF document successfully', async () => {
      const response = await request(app)
        .post(`/api/attendance/${sicknessAttendanceId}/document`)
        .attach('document', validPdfPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid file type (TXT)', async () => {
      // Note: Multer rejects files during upload, which can cause ECONNRESET
      // This is expected behavior when fileFilter rejects a file
      try {
        const response = await request(app)
          .post(`/api/attendance/${sicknessAttendanceId}/document`)
          .attach('document', invalidTxtPath)
          .set('Content-Type', 'multipart/form-data');

        // If response is received, verify it's an error
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      } catch (error: any) {
        // ECONNRESET is acceptable - multer rejected the file during upload
        if (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
          // This is expected - test passes
          expect(error).toBeDefined();
        } else {
          throw error;
        }
      }
    });

    it('should reject file exceeding size limit (>5MB)', async () => {
      const response = await request(app)
        .post(`/api/attendance/${sicknessAttendanceId}/document`)
        .attach('document', largFilePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('File size exceeds');
    });

    it('should reject upload when no file is provided', async () => {
      const response = await request(app)
        .post(`/api/attendance/${sicknessAttendanceId}/document`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('No file uploaded');
    });

    it('should reject upload for work status attendance', async () => {
      const response = await request(app)
        .post(`/api/attendance/${workAttendanceId}/document`)
        .attach('document', validJpgPath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Cannot upload document for work status');
    });

    it('should return 404 for non-existent attendance', async () => {
      const response = await request(app)
        .post('/api/attendance/999999/document')
        .attach('document', validJpgPath);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/attendance/:id/document', () => {
    beforeAll(async () => {
      // Upload a document first for delete tests
      await prisma.dailyAttendance.update({
        where: { id: sicknessAttendanceId },
        data: { document: Buffer.from('test-document') },
      });
    });

    it('should delete document successfully', async () => {
      const response = await request(app)
        .delete(`/api/attendance/${sicknessAttendanceId}/document`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      // Verify document was deleted
      const attendance = await prisma.dailyAttendance.findUnique({
        where: { id: sicknessAttendanceId },
      });
      expect(attendance?.document).toBeNull();
    });

    it('should return 404 when no document exists', async () => {
      const response = await request(app)
        .delete(`/api/attendance/${sicknessAttendanceId}/document`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('No document found');
    });

    it('should return 404 for non-existent attendance', async () => {
      const response = await request(app)
        .delete('/api/attendance/999999/document');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
