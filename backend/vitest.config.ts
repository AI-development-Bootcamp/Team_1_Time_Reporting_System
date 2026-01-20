import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    testTimeout: 30000, // 30 seconds for HTTP integration tests
    coverage: {
      provider: 'v8',
      include: [
        'src/controllers/**/*.ts',
        'src/services/**/*.ts',
        'src/validators/**/*.ts',
        'src/routes/**/*.ts',
        'src/middleware/**/*.ts',
        'src/utils/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        'dist/**',
        '**/tests/**',
        // Exclude other members' files
        'src/routes/Attendance.ts',
        'src/routes/TimeLogs.ts',
        // 'src/services/**', // Removed to allow coverage for our services
        'src/index.ts', // Entry point, not unit testable
        'src/utils/DatabaseConfig.ts', // Infrastructure setup
        'src/utils/prismaClient.ts', // Prisma singleton
      ],
      thresholds: {
        global: {
          lines: 60,
          functions: 60,
          branches: 60,
          statements: 60,
        },
      },
    },
  },
});
