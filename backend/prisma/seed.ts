import { PrismaClient, UserType, TaskStatus, DailyAttendanceStatus, LocationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing seed data (in correct order to respect foreign key constraints)
  console.log('🧹 Clearing existing seed data...');
  await prisma.projectTimeLogs.deleteMany();
  await prisma.dailyAttendance.deleteMany();
  await prisma.taskWorker.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing data');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('Password123', 10);

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      mail: 'admin@timereporting.com',
      password: hashedPassword,
      userType: UserType.admin,
      active: true,
    },
  });
  console.log('✅ Created admin user:', admin.mail);

  // Create Worker Users
  const worker1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      mail: 'john.doe@timereporting.com',
      password: hashedPassword,
      userType: UserType.worker,
      active: true,
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      mail: 'jane.smith@timereporting.com',
      password: hashedPassword,
      userType: UserType.worker,
      active: true,
    },
  });

  const worker3 = await prisma.user.create({
    data: {
      name: 'David Cohen',
      mail: 'david.cohen@timereporting.com',
      password: hashedPassword,
      userType: UserType.worker,
      active: true,
    },
  });

  // Create test user for Month History (ID will be assigned by DB)
  const testUser = await prisma.user.create({
    data: {
      name: 'Test User Month History',
      mail: 'test.monthhistory@timereporting.com',
      password: hashedPassword,
      userType: UserType.worker,
      active: true,
    },
  });
  console.log('✅ Created worker users (including test user with ID:', testUser.id, ')');

  // Create Clients
  const techCorp = await prisma.client.create({
    data: {
      name: 'TechCorp Solutions',
      description: 'Leading technology consulting firm specializing in enterprise software solutions',
      active: true,
    },
  });

  const globalSolutions = await prisma.client.create({
    data: {
      name: 'Global Solutions Inc',
      description: 'International business consulting and digital transformation services',
      active: true,
    },
  });

  const startupHub = await prisma.client.create({
    data: {
      name: 'StartupHub',
      description: 'Innovation lab and startup accelerator',
      active: true,
    },
  });
  console.log('✅ Created clients');

  // Create Projects
  const techCorpFrontend = await prisma.project.create({
    data: {
      name: 'Frontend Modernization',
      clientId: techCorp.id,
      projectManagerId: admin.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      description: 'Modernize legacy frontend application with React and TypeScript',
      active: true,
    },
  });

  const techCorpBackend = await prisma.project.create({
    data: {
      name: 'Backend API Development',
      clientId: techCorp.id,
      projectManagerId: admin.id,
      startDate: new Date('2024-02-01'),
      description: 'Build RESTful API with Node.js and PostgreSQL',
      active: true,
    },
  });

  const globalSolutionsMobile = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      clientId: globalSolutions.id,
      projectManagerId: admin.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-09-30'),
      description: 'Cross-platform mobile application for iOS and Android',
      active: true,
    },
  });

  const startupHubWebsite = await prisma.project.create({
    data: {
      name: 'Corporate Website Redesign',
      clientId: startupHub.id,
      projectManagerId: admin.id,
      startDate: new Date('2024-03-01'),
      description: 'Complete redesign of corporate website with modern UI/UX',
      active: true,
    },
  });
  console.log('✅ Created projects');

  // Create Tasks
  const frontendUxTask = await prisma.task.create({
    data: {
      name: 'UI/UX Design',
      projectId: techCorpFrontend.id,
      startDate: new Date('2024-01-01'),
      description: 'Design new user interface and user experience flows',
      status: TaskStatus.open,
    },
  });

  const frontendDevTask = await prisma.task.create({
    data: {
      name: 'React Component Development',
      projectId: techCorpFrontend.id,
      startDate: new Date('2024-01-15'),
      description: 'Develop reusable React components',
      status: TaskStatus.open,
    },
  });

  const backendApiTask = await prisma.task.create({
    data: {
      name: 'REST API Implementation',
      projectId: techCorpBackend.id,
      startDate: new Date('2024-02-01'),
      description: 'Implement RESTful API endpoints',
      status: TaskStatus.open,
    },
  });

  const backendDbTask = await prisma.task.create({
    data: {
      name: 'Database Schema Design',
      projectId: techCorpBackend.id,
      startDate: new Date('2024-02-01'),
      description: 'Design and implement database schema',
      status: TaskStatus.closed,
    },
  });

  const mobileIosTask = await prisma.task.create({
    data: {
      name: 'iOS Native Development',
      projectId: globalSolutionsMobile.id,
      startDate: new Date('2024-01-15'),
      description: 'Develop iOS native application',
      status: TaskStatus.open,
    },
  });

  const mobileAndroidTask = await prisma.task.create({
    data: {
      name: 'Android Native Development',
      projectId: globalSolutionsMobile.id,
      startDate: new Date('2024-01-15'),
      description: 'Develop Android native application',
      status: TaskStatus.open,
    },
  });

  const websiteDesignTask = await prisma.task.create({
    data: {
      name: 'Website Design & Wireframing',
      projectId: startupHubWebsite.id,
      startDate: new Date('2024-03-01'),
      description: 'Create wireframes and design mockups',
      status: TaskStatus.open,
    },
  });
  console.log('✅ Created tasks');

  // Create User-Task Assignments (TaskWorker)
  await prisma.taskWorker.createMany({
    data: [
      { taskId: frontendUxTask.id, userId: worker1.id },
      { taskId: frontendDevTask.id, userId: worker1.id },
      { taskId: frontendDevTask.id, userId: worker2.id },
      { taskId: backendApiTask.id, userId: worker2.id },
      { taskId: backendDbTask.id, userId: worker2.id },
      { taskId: mobileIosTask.id, userId: worker3.id },
      { taskId: mobileAndroidTask.id, userId: worker3.id },
      { taskId: websiteDesignTask.id, userId: worker1.id },
      // Assign test user to tasks
      { taskId: frontendDevTask.id, userId: testUser.id },
      { taskId: backendApiTask.id, userId: testUser.id },
      { taskId: websiteDesignTask.id, userId: testUser.id },
    ],
  });
  console.log('✅ Created user-task assignments');

  // Create sample DailyAttendance records
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const attendance1 = await prisma.dailyAttendance.create({
    data: {
      userId: worker1.id,
      date: yesterday,
      startTime: new Date('1970-01-01T09:00:00'),
      endTime: new Date('1970-01-01T17:30:00'),
      status: DailyAttendanceStatus.work,
    },
  });

  const attendance2 = await prisma.dailyAttendance.create({
    data: {
      userId: worker2.id,
      date: yesterday,
      startTime: new Date('1970-01-01T08:30:00'),
      endTime: new Date('1970-01-01T17:00:00'),
      status: DailyAttendanceStatus.work,
    },
  });

  const attendance3 = await prisma.dailyAttendance.create({
    data: {
      userId: worker3.id,
      date: yesterday,
      startTime: new Date('1970-01-01T09:00:00'),
      endTime: new Date('1970-01-01T13:00:00'),
      status: DailyAttendanceStatus.halfDayOff,
    },
  });
  console.log('✅ Created daily attendance records');

  // Create sample ProjectTimeLogs
  await prisma.projectTimeLogs.createMany({
    data: [
      {
        dailyAttendanceId: attendance1.id,
        taskId: frontendUxTask.id,
        durationMin: 240, // 4 hours
        location: LocationStatus.office,
        description: 'Worked on UI mockups and design system',
      },
      {
        dailyAttendanceId: attendance1.id,
        taskId: frontendDevTask.id,
        durationMin: 270, // 4.5 hours
        location: LocationStatus.office,
        description: 'Developed React components',
      },
      {
        dailyAttendanceId: attendance2.id,
        taskId: backendApiTask.id,
        durationMin: 480, // 8 hours
        location: LocationStatus.home,
        description: 'Implemented REST API endpoints',
      },
      {
        dailyAttendanceId: attendance3.id,
        taskId: mobileIosTask.id,
        durationMin: 240, // 4 hours
        location: LocationStatus.client,
        description: 'Client meeting and iOS development',
      },
    ],
  });
  console.log('✅ Created project time logs');

  // ============================================================================
  // CREATE COMPREHENSIVE MONTH HISTORY TEST DATA FOR TEST USER
  // ============================================================================
  console.log('🧪 Creating Month History test scenarios for user:', testUser.id);

  // Scenario 1: Full work day (≥9h) - GREEN badge
  const jan20 = await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-20'), // Tuesday
      startTime: new Date('1970-01-01T09:00:00'),
      endTime: new Date('1970-01-01T18:00:00'), // 9 hours
      status: DailyAttendanceStatus.work,
    },
  });
  await prisma.projectTimeLogs.createMany({
    data: [
      {
        dailyAttendanceId: jan20.id,
        taskId: frontendDevTask.id,
        durationMin: 300, // 5 hours
        location: LocationStatus.office,
        description: 'React component development',
      },
      {
        dailyAttendanceId: jan20.id,
        taskId: backendApiTask.id,
        durationMin: 240, // 4 hours
        location: LocationStatus.office,
        description: 'API endpoint testing',
      },
    ],
  });

  // Scenario 2: Partial work day (<9h) - ORANGE badge
  const jan19 = await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-19'), // Monday
      startTime: new Date('1970-01-01T09:00:00'),
      endTime: new Date('1970-01-01T13:30:00'), // 4.5 hours
      status: DailyAttendanceStatus.work,
    },
  });
  await prisma.projectTimeLogs.create({
    data: {
      dailyAttendanceId: jan19.id,
      taskId: websiteDesignTask.id,
      durationMin: 270, // 4.5 hours
      location: LocationStatus.home,
      description: 'Website wireframing',
    },
  });

  // Scenario 3: Day off - BLUE badge
  await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-18'), // Sunday
      startTime: new Date('1970-01-01T00:00:00'),
      endTime: new Date('1970-01-01T00:00:00'),
      status: DailyAttendanceStatus.dayOff,
    },
  });

  // Scenario 4: Half day off only - BLUE badge
  await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-15'), // Thursday
      startTime: new Date('1970-01-01T00:00:00'),
      endTime: new Date('1970-01-01T00:00:00'),
      status: DailyAttendanceStatus.halfDayOff,
    },
  });

  // Scenario 5: Half day off + Work (combined badge)
  const jan14Morning = await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-14'), // Wednesday
      startTime: new Date('1970-01-01T00:00:00'),
      endTime: new Date('1970-01-01T00:00:00'),
      status: DailyAttendanceStatus.halfDayOff,
    },
  });
  const jan14Afternoon = await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-14'), // Wednesday (same date)
      startTime: new Date('1970-01-01T13:00:00'),
      endTime: new Date('1970-01-01T17:30:00'), // 4.5 hours
      status: DailyAttendanceStatus.work,
    },
  });
  await prisma.projectTimeLogs.create({
    data: {
      dailyAttendanceId: jan14Afternoon.id,
      taskId: frontendDevTask.id,
      durationMin: 270, // 4.5 hours
      location: LocationStatus.office,
      description: 'Afternoon development session',
    },
  });

  // Scenario 6: Sickness with document - BLUE badge
  await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-13'), // Tuesday
      startTime: new Date('1970-01-01T00:00:00'),
      endTime: new Date('1970-01-01T00:00:00'),
      status: DailyAttendanceStatus.sickness,
      documentPath: '/documents/sick_note_2026-01-13.pdf',
    },
  });

  // Scenario 7: Sickness without document - RED badge (missing)
  await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-12'), // Monday
      startTime: new Date('1970-01-01T00:00:00'),
      endTime: new Date('1970-01-01T00:00:00'),
      status: DailyAttendanceStatus.sickness,
      documentPath: null,
    },
  });

  // Scenario 8: Reserves with document - BLUE badge
  await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-11'), // Sunday
      startTime: new Date('1970-01-01T00:00:00'),
      endTime: new Date('1970-01-01T00:00:00'),
      status: DailyAttendanceStatus.reserves,
      documentPath: '/documents/reserves_2026-01-11.pdf',
    },
  });

  // Scenario 9: Reserves without document - RED badge (missing)
  await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-08'), // Thursday
      startTime: new Date('1970-01-01T00:00:00'),
      endTime: new Date('1970-01-01T00:00:00'),
      status: DailyAttendanceStatus.reserves,
      documentPath: null,
    },
  });

  // Scenario 10: Multiple DailyAttendance records (morning + afternoon split)
  const jan07Morning = await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-07'), // Wednesday
      startTime: new Date('1970-01-01T08:00:00'),
      endTime: new Date('1970-01-01T12:00:00'), // 4 hours
      status: DailyAttendanceStatus.work,
    },
  });
  await prisma.projectTimeLogs.create({
    data: {
      dailyAttendanceId: jan07Morning.id,
      taskId: frontendDevTask.id,
      durationMin: 240, // 4 hours
      location: LocationStatus.office,
      description: 'Morning development session',
    },
  });

  const jan07Afternoon = await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-07'), // Wednesday (same date)
      startTime: new Date('1970-01-01T13:00:00'),
      endTime: new Date('1970-01-01T18:00:00'), // 5 hours
      status: DailyAttendanceStatus.work,
    },
  });
  await prisma.projectTimeLogs.create({
    data: {
      dailyAttendanceId: jan07Afternoon.id,
      taskId: backendApiTask.id,
      durationMin: 300, // 5 hours
      location: LocationStatus.office,
      description: 'Afternoon API development',
    },
  });

  // Scenario 11: Missing attendance on workday (Sun-Thu) - RED badge
  // January 6, 2026 (Tuesday) - no attendance record created

  // Scenario 12: Weekend (Fri/Sat) - auto-detected, no attendance needed
  // January 10, 2026 (Friday) - no attendance record
  // January 17, 2026 (Saturday) - no attendance record

  // Scenario 13: Work with exact 9 hours (boundary test)
  const jan05 = await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-05'), // Monday
      startTime: new Date('1970-01-01T09:00:00'),
      endTime: new Date('1970-01-01T18:00:00'), // exactly 9 hours
      status: DailyAttendanceStatus.work,
    },
  });
  await prisma.projectTimeLogs.create({
    data: {
      dailyAttendanceId: jan05.id,
      taskId: websiteDesignTask.id,
      durationMin: 540, // 9 hours
      location: LocationStatus.client,
      description: 'Full day client meeting and design work',
    },
  });

  // Scenario 14: Very short work day (edge case)
  const jan04 = await prisma.dailyAttendance.create({
    data: {
      userId: testUser.id,
      date: new Date('2026-01-04'), // Sunday
      startTime: new Date('1970-01-01T10:00:00'),
      endTime: new Date('1970-01-01T11:30:00'), // 1.5 hours
      status: DailyAttendanceStatus.work,
    },
  });
  await prisma.projectTimeLogs.create({
    data: {
      dailyAttendanceId: jan04.id,
      taskId: frontendDevTask.id,
      durationMin: 90, // 1.5 hours
      location: LocationStatus.home,
      description: 'Quick bug fix',
    },
  });

  console.log('✅ Created comprehensive Month History test data');
  console.log('📊 Test scenarios for user', testUser.id, ':');
  console.log('   - Jan 20: Full work day (9h) - GREEN badge');
  console.log('   - Jan 19: Partial work day (4.5h) - ORANGE badge');
  console.log('   - Jan 18: Day off - BLUE badge');
  console.log('   - Jan 15: Half day off only - BLUE badge');
  console.log('   - Jan 14: Half day off + Work (4.5h) - COMBINED badge');
  console.log('   - Jan 13: Sickness with document - BLUE badge');
  console.log('   - Jan 12: Sickness without document - RED badge (missing)');
  console.log('   - Jan 11: Reserves with document - BLUE badge');
  console.log('   - Jan 08: Reserves without document - RED badge (missing)');
  console.log('   - Jan 07: Multiple attendance records (9h total) - GREEN badge');
  console.log('   - Jan 06: Missing attendance - RED badge');
  console.log('   - Jan 05: Exact 9h work - GREEN badge');
  console.log('   - Jan 04: Short work day (1.5h) - ORANGE badge');
  console.log('   - Jan 10, 17: Weekend (no attendance) - BLUE badge');
  console.log('   - Jan 16: Friday (no attendance) - BLUE badge');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Admin: admin@timereporting.com / Password123');
  console.log('   Worker: john.doe@timereporting.com / Password123');
  console.log('   Worker: jane.smith@timereporting.com / Password123');
  console.log('   Worker: david.cohen@timereporting.com / Password123');
  console.log('   Test User: test.monthhistory@timereporting.com / Password123 (ID:', testUser.id, ')');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
