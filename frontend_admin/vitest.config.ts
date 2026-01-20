import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@components', replacement: path.resolve(__dirname, './src/components') },
      { find: '@pages', replacement: path.resolve(__dirname, './src/pages') },
      { find: '@hooks', replacement: path.resolve(__dirname, './src/hooks') },
      { find: '@services', replacement: path.resolve(__dirname, './src/services') },
      { find: '@types', replacement: path.resolve(__dirname, './src/types') },
      { find: '@shared', replacement: path.resolve(__dirname, '../shared/src') },
      { find: '@test', replacement: path.resolve(__dirname, './src/test') },
    ],
  },
});
