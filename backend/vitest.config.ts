import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds for HTTP integration tests
    coverage: {
      provider: 'v8',
      include: [
        // M1-010: Auth Backend files
        'src/routes/Auth.ts',
        'src/utils/Bcrypt.ts',
        'src/utils/validationSchemas.ts', // Contains loginSchema for M1-010
        // M1-011: User CRUD Backend files
        'src/routes/admin/Users.ts',
        'src/middleware/Admin.ts',
        'src/utils/Response.ts',
        'src/middleware/ErrorHandler.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        // Exclude other members' files
        'src/routes/Attendance.ts',
        'src/routes/TimeLogs.ts',
        'src/services/**',
        'src/index.ts', // Entry point, not unit testable
        'src/utils/DatabaseConfig.ts', // Infrastructure setup
        'src/utils/prismaClient.ts', // Prisma singleton
      ],
    },
  },
});
