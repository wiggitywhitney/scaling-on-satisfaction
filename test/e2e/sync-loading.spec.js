// ABOUTME: E2E tests for synchronized variant loading using Playwright
// ABOUTME: Verifies admin panel sync state, audience loading, and multi-variant coordination

import { test, expect } from '@playwright/test';

const COORDINATOR = 'http://localhost:8080';
const VARIANT_A = 'http://localhost:8081';
const VARIANT_B = 'http://localhost:8082';

test.describe('Synchronized Variant Loading', () => {
  test.beforeEach(async () => {
    // Reset all instances before each test
    await fetch(`${COORDINATOR}/api/admin/reset`, { method: 'POST' });
    // Also reset variants directly in case coordinator forwarding is being tested
    await fetch(`${VARIANT_A}/api/admin/reset`, { method: 'POST' });
    await fetch(`${VARIANT_B}/api/admin/reset`, { method: 'POST' });
  });

  test('admin panel shows variant status for both variants', async ({ page }) => {
    await page.goto(`${COORDINATOR}/admin`);

    // Wait for variants section to populate
    await expect(page.locator('.variant-card')).toHaveCount(3, { timeout: 10000 });

    // Should show this instance + both variants
    const cards = page.locator('.variant-card');
    await expect(cards.nth(0)).toContainText('this instance');
    await expect(cards.nth(1)).toContainText('Round 1 Funny');
    await expect(cards.nth(2)).toContainText('Round 1 Dry');
  });

  test('admin panel shows preparing state during sync window', async ({ page }) => {
    await page.goto(`${COORDINATOR}/admin`);
    await page.waitForTimeout(1000);

    // Click advance
    await page.click('#btn-advance');

    // Should show "Preparing..." sync status
    const syncStatus = page.locator('#sync-status');
    await expect(syncStatus).toContainText('Preparing', { timeout: 5000 });
    await expect(syncStatus).toHaveClass(/preparing/);
  });

  test('admin panel transitions from preparing to ready after sync delay', async ({ page }) => {
    await page.goto(`${COORDINATOR}/admin`);
    await page.waitForTimeout(1000);

    await page.click('#btn-advance');

    // Should start as preparing
    const syncStatus = page.locator('#sync-status');
    await expect(syncStatus).toContainText('Preparing', { timeout: 5000 });

    // Should transition to ready after sync delay (8s) + poll interval (3s)
    await expect(syncStatus).toContainText('Ready', { timeout: 15000 });
    await expect(syncStatus).toHaveClass(/ready/);
  });

  test('advance increments part on all variants simultaneously', async () => {
    // Verify all start at 0 after reset
    const coordBefore = await fetch(`${COORDINATOR}/api/admin/status`).then(r => r.json());
    expect(coordBefore.currentPart).toBe(0);

    // Advance via API (not UI click, to avoid timing issues)
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    // All three instances should now be at part 1
    const coordAfter = await fetch(`${COORDINATOR}/api/admin/status`).then(r => r.json());
    const afterA = await fetch(`${VARIANT_A}/api/admin/status`).then(r => r.json());
    const afterB = await fetch(`${VARIANT_B}/api/admin/status`).then(r => r.json());

    expect(coordAfter.currentPart).toBe(1);
    expect(afterA.currentPart).toBe(1);
    expect(afterB.currentPart).toBe(1);
  });

  test('audience on variant A sees loading then story after sync window', async ({ page }) => {
    // Advance part 1 via coordinator
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    // Open audience page on variant A
    await page.goto(VARIANT_A);

    // Should show loading/preparing state first
    const storyText = page.locator('#story-text');

    // Wait for either loading or preparing to appear
    await expect(page.locator('#loading.active, #preparing.active').first()).toBeVisible({ timeout: 10000 });

    // Eventually story text should appear (after generation + sync window)
    await expect(storyText).toBeVisible({ timeout: 45000 });
    const text = await storyText.textContent();
    expect(text.length).toBeGreaterThan(50);
  });

  test('audience on variant B sees loading then story after sync window', async ({ page }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    await page.goto(VARIANT_B);

    const loading = page.locator('#loading');
    const preparing = page.locator('#preparing');
    const storyText = page.locator('#story-text');

    await expect(page.locator('#loading.active, #preparing.active').first()).toBeVisible({ timeout: 10000 });
    await expect(storyText).toBeVisible({ timeout: 45000 });
    const text = await storyText.textContent();
    expect(text.length).toBeGreaterThan(50);
  });

  test('both variants show stories at roughly the same time', async ({ browser }) => {
    // Open two pages — one per variant
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();

    // Advance via coordinator
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    // Navigate both audience pages
    await Promise.all([
      pageA.goto(VARIANT_A),
      pageB.goto(VARIANT_B),
    ]);

    const storyA = pageA.locator('#story-text');
    const storyB = pageB.locator('#story-text');

    // Wait for both stories to appear, record when each becomes visible
    const startTime = Date.now();
    const [timeA, timeB] = await Promise.all([
      storyA.waitFor({ state: 'visible', timeout: 45000 }).then(() => Date.now() - startTime),
      storyB.waitFor({ state: 'visible', timeout: 45000 }).then(() => Date.now() - startTime),
    ]);

    // Both should appear within a few seconds of each other
    // The sync delay (8s) should prevent one from appearing way before the other
    const drift = Math.abs(timeA - timeB);
    console.log(`Variant A visible at ${timeA}ms, Variant B at ${timeB}ms, drift: ${drift}ms`);

    // Allow up to 5s drift — without sync this could be 10s+
    expect(drift).toBeLessThan(5000);

    await pageA.close();
    await pageB.close();
  });

  test('vote buttons appear after story loads', async ({ page }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });
    await page.goto(VARIANT_A);

    // Wait for story to load
    await expect(page.locator('#story-text')).toBeVisible({ timeout: 45000 });

    // Vote buttons should be visible
    const voteButtons = page.locator('#vote-buttons');
    await expect(voteButtons).toHaveClass(/active/);

    // Both thumbs buttons should be enabled
    const thumbsUp = page.locator('[data-vote="thumbs_up"]');
    const thumbsDown = page.locator('[data-vote="thumbs_down"]');
    await expect(thumbsUp).toBeEnabled();
    await expect(thumbsDown).toBeEnabled();
  });

  test('voting locks the buttons and shows selection', async ({ page }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });
    await page.goto(VARIANT_A);

    await expect(page.locator('#story-text')).toBeVisible({ timeout: 45000 });

    // Click thumbs up
    await page.click('[data-vote="thumbs_up"]');

    // Thumbs up should be selected, thumbs down dimmed
    await expect(page.locator('[data-vote="thumbs_up"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-vote="thumbs_down"]')).toHaveClass(/dimmed/);

    // Both should be disabled
    await expect(page.locator('[data-vote="thumbs_up"]')).toBeDisabled();
    await expect(page.locator('[data-vote="thumbs_down"]')).toBeDisabled();
  });

  test('admin session count increases when audience loads story', async ({ page, browser }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    // Open audience page to create a session
    const audiencePage = await browser.newPage();
    await audiencePage.goto(VARIANT_A);
    await expect(audiencePage.locator('#story-text')).toBeVisible({ timeout: 45000 });

    // Check admin shows at least 1 session (may have more from prior test pollution)
    await page.goto(`${VARIANT_A}/admin`);
    const infoText = await page.locator('#info').textContent({ timeout: 10000 });
    const sessionCount = parseInt(infoText.match(/(\d+) active/)?.[1] || '0', 10);
    expect(sessionCount).toBeGreaterThanOrEqual(1);

    await audiencePage.close();
  });
});
