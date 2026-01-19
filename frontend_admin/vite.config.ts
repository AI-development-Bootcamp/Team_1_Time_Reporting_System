import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  test: {
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '../shared/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: ['node_modules', 'dist', '.git'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: [
        // M1-020: Login UI files only
        '../shared/src/types/User.ts',
        '../shared/src/context/AuthContext.tsx',
        '../shared/src/hooks/useLogin.ts',
        '../shared/src/components/ProtectedRoute/ProtectedRoute.tsx',
        '../shared/src/utils/ApiClient.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**',
        '**/dist/**',
        // Exclude other members' files
        '../shared/src/components/Login/**',
        '../shared/src/hooks/useAuth.ts',
      ],
      all: true,
    },
  },
});
