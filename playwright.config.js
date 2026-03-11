// ABOUTME: Playwright config for E2E tests against running app instances
// ABOUTME: Tests require 2 running instances (coordinator:8080, variant:8081)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 300000,
  retries: 0,
  workers: 1,
  use: {
    headless: true,
  },
});
