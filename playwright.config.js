// ABOUTME: Playwright config for E2E tests against running app instances
// ABOUTME: Tests require 3 running instances (coordinator:8080, variant-a:8081, variant-b:8082)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60000,
  retries: 0,
  use: {
    headless: true,
  },
});
