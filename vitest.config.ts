import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./backend/test/setup.ts'],
    env: {
      NODE_ENV: 'test'
    },
    coverage: {
      include: ['backend/**/*.ts'],
      exclude: ['backend/**/*.test.ts', 'backend/types/**']
    }
  }
});