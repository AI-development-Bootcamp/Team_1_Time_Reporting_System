/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const parsedPort = parseInt(env.FRONTEND_ADMIN_PORT || '5173', 10);
  const port = Number.isNaN(parsedPort) || !Number.isInteger(parsedPort) ? 5173 : parsedPort;

  return {
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
      port,
      strictPort: false,
      fs: {
        allow: ['..']
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
          '../shared/src/components/Login/**',
          '../shared/src/hooks/useAuth.ts',
        ],
        all: true,
      },
    },
  };
});
