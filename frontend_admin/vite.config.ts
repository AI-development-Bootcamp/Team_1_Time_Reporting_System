/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, './src'),
        path.resolve(__dirname, '../shared/src'),
        path.resolve(__dirname, 'node_modules'), // Explicitly allow node_modules if needed, or assume Vite default
        // Actually, just allowing shared and current is enough if node_modules are handled standardly
        path.resolve(__dirname, '../node_modules')
      ],
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
    environment: 'jsdom',
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
