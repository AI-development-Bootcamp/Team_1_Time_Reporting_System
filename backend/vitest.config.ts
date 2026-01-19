import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: [
        // M1-010: Auth Backend files only
        'src/routes/Auth.ts',
        'src/utils/Bcrypt.ts',
        'src/utils/validationSchemas.ts', // Contains loginSchema for M1-010
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        // Exclude Phase 0 shared infrastructure
        'src/utils/Response.ts',
        'src/middleware/ErrorHandler.ts',
        // Exclude other members' files
        'src/routes/admin/**',
        'src/routes/Attendance.ts',
        'src/routes/TimeLogs.ts',
        'src/services/**',
      ],
    },
  },
});
