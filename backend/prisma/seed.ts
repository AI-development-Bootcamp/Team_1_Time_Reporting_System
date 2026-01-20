import { PrismaClient, UserType, TaskStatus, DailyAttendanceStatus, LocationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Populates the database with a deterministic set of seed data for users, clients, projects, tasks, task assignments, attendance, and time logs.
 *
 * Removes existing seed data (respecting foreign-key order) and inserts: one admin and three worker users (all created with a single hashed password), three clients, four projects, several tasks, task-worker assignments, sample daily attendance records, and project time logs; progress is emitted to the console.
 */
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
  // Password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const hashedPassword = await bcrypt.hash('Password123!', 10);

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
  console.log('✅ Created worker users');

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

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Admin: admin@timereporting.com / Password123!');
  console.log('   Worker: john.doe@timereporting.com / Password123!');
  console.log('   Worker: jane.smith@timereporting.com / Password123!');
  console.log('   Worker: david.cohen@timereporting.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });