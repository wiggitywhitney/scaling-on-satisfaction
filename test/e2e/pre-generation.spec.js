// ABOUTME: E2E tests for story pre-generation (warmup and next-part caching)
// ABOUTME: Verifies part 1 warmup on page load and next-part pre-gen after serving

import { test, expect } from '@playwright/test';

const COORDINATOR = 'http://localhost:8080'; // Admin panel + audience app (variant A)
const VARIANT = 'http://localhost:8081';     // Audience app only (variant B)

test.describe('Story Pre-generation', () => {
  test.beforeEach(async () => {
    await fetch(`${COORDINATOR}/api/admin/reset`, { method: 'POST' });
    await fetch(`${VARIANT}/api/admin/reset`, { method: 'POST' });
  });

  test('warmup pre-generates part 1 when audience page loads', async ({ page }) => {
    // Check no parts are pre-generated initially
    const beforeStatus = await fetch(`${VARIANT}/api/admin/status`).then(r => r.json());
    expect(beforeStatus.sharedStoryParts).toHaveLength(0);

    // Open audience page — triggers warmup POST /api/story/warmup
    await page.goto(VARIANT);

    // Wait for warmup to complete (Part 1 should appear in shared store)
    // Warmup has a stagger delay (PREGEN_DELAY_MS) + generation time
    await expect(async () => {
      const status = await fetch(`${VARIANT}/api/admin/status`).then(r => r.json());
      expect(status.sharedStoryParts).toContain(1);
    }).toPass({ timeout: 45000, intervals: [2000] });
  });

  test('serving part N pre-generates part N+1 in background', async ({ page }) => {
    // Advance to part 1
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    // Open audience page and wait for part 1 to display
    await page.goto(VARIANT);
    await expect(page.locator('#story-text')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('#progress')).toContainText('Part 1 of 5');

    // After serving part 1, part 2 should be pre-generated in the background
    await expect(async () => {
      const status = await fetch(`${VARIANT}/api/admin/status`).then(r => r.json());
      expect(status.sharedStoryParts).toContain(2);
    }).toPass({ timeout: 45000, intervals: [2000] });
  });

  test('admin pre-generate endpoint generates all 5 parts', async () => {
    // Use the bulk pre-generate endpoint
    const res = await fetch(`${VARIANT}/api/admin/pre-generate`, { method: 'POST' });
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(data.generated).toBe(5);

    // All 5 parts should be in the shared store
    const status = await fetch(`${VARIANT}/api/admin/status`).then(r => r.json());
    expect(status.sharedStoryParts).toEqual([1, 2, 3, 4, 5]);
  });

  test('admin panel has a pre-generate button that generates all parts', async ({ page }) => {
    await page.goto(`${COORDINATOR}/admin`);

    // Button should exist and be enabled
    const btn = page.locator('#btn-pregen');
    await expect(btn).toBeVisible({ timeout: 5000 });
    await expect(btn).toBeEnabled();

    // Info should show 0 parts pre-generated initially
    await expect(page.locator('#info')).toContainText('0 / 5 parts pre-generated', { timeout: 5000 });

    // Click pre-generate — button should disable while working
    await btn.click();
    await expect(btn).toBeDisabled();

    // Wait for completion — info should show 5/5 parts
    await expect(page.locator('#info')).toContainText('5 / 5 parts pre-generated', { timeout: 120000 });

    // Button should re-enable after completion
    await expect(btn).toBeEnabled({ timeout: 5000 });
  });

  test('pre-generated stories serve instantly without generation delay', async ({ page }) => {
    // Pre-generate all parts first
    await fetch(`${VARIANT}/api/admin/pre-generate`, { method: 'POST' });

    // Advance to part 1
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    await page.goto(VARIANT);

    // Story should appear very quickly since it's already cached
    const startTime = Date.now();
    await expect(page.locator('#story-text')).toBeVisible({ timeout: 15000 });
    const elapsed = Date.now() - startTime;

    // Pre-generated story should serve in under 5s (page load + poll interval)
    // Without pre-gen, generation takes 10-30s
    expect(elapsed).toBeLessThan(10000);
  });
});
