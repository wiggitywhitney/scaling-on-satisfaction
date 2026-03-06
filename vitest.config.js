// ABOUTME: Vitest test runner configuration
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    exclude: ['test/e2e/**', 'node_modules/**'],
  },
});
