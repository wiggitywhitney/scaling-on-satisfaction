// ABOUTME: E2E tests for synchronized variant loading using Playwright
// ABOUTME: Verifies admin panel sync state, audience loading, and multi-variant coordination

import { test, expect } from '@playwright/test';

const COORDINATOR = 'http://localhost:8080'; // Admin panel + audience app (variant A)
const VARIANT = 'http://localhost:8081';     // Audience app only (variant B)

test.describe('Synchronized Variant Loading', () => {
  test.beforeEach(async () => {
    await fetch(`${COORDINATOR}/api/admin/reset`, { method: 'POST' });
    await fetch(`${VARIANT}/api/admin/reset`, { method: 'POST' });
  });

  test('admin panel shows variant status', async ({ page }) => {
    await page.goto(`${COORDINATOR}/admin`);

    // Coordinator shows this instance + one remote variant
    await expect(page.locator('.variant-card')).toHaveCount(2, { timeout: 10000 });

    const cards = page.locator('.variant-card');
    await expect(cards.nth(0)).toContainText('this instance');
  });

  test('admin panel shows preparing state during sync window', async ({ page }) => {
    await page.goto(`${COORDINATOR}/admin`);
    await page.waitForTimeout(1000);

    // Advance with a readyAt 8s in the future to trigger sync window
    const readyAt = Date.now() + 8000;
    await fetch(`${COORDINATOR}/api/admin/advance?readyAt=${readyAt}`, { method: 'POST' });

    await page.waitForTimeout(500);

    const syncStatus = page.locator('#sync-status');
    await expect(syncStatus).toContainText('Preparing', { timeout: 5000 });
    await expect(syncStatus).toHaveClass(/preparing/);
  });

  test('admin panel transitions from preparing to ready after sync delay', async ({ page }) => {
    await page.goto(`${COORDINATOR}/admin`);
    await page.waitForTimeout(1000);

    const readyAt = Date.now() + 5000;
    await fetch(`${COORDINATOR}/api/admin/advance?readyAt=${readyAt}`, { method: 'POST' });

    await page.waitForTimeout(500);

    const syncStatus = page.locator('#sync-status');
    await expect(syncStatus).toContainText('Preparing', { timeout: 5000 });

    // Should transition to ready after the readyAt time passes + poll interval (3s)
    await expect(syncStatus).toContainText('Ready', { timeout: 15000 });
    await expect(syncStatus).toHaveClass(/ready/);
  });

  test('advance increments part on both instances simultaneously', async () => {
    const coordBefore = await fetch(`${COORDINATOR}/api/admin/status`).then(r => r.json());
    expect(coordBefore.currentPart).toBe(0);

    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    const coordAfter = await fetch(`${COORDINATOR}/api/admin/status`).then(r => r.json());
    const variantAfter = await fetch(`${VARIANT}/api/admin/status`).then(r => r.json());

    expect(coordAfter.currentPart).toBe(1);
    expect(variantAfter.currentPart).toBe(1);
  });

  test('coordinator audience sees story after advance', async ({ page }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    await page.goto(COORDINATOR);

    const storyText = page.locator('#story-text');
    await expect(storyText).toBeVisible({ timeout: 60000 });
    const text = await storyText.textContent();
    expect(text.length).toBeGreaterThan(50);
  });

  test('variant audience sees story after advance', async ({ page }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    await page.goto(VARIANT);

    const storyText = page.locator('#story-text');
    await expect(storyText).toBeVisible({ timeout: 60000 });
    const text = await storyText.textContent();
    expect(text.length).toBeGreaterThan(50);
  });

  test('both instances show pre-generated stories at roughly the same time', async ({ browser }) => {
    // Pre-generate Part 1 on both instances so serving is instant (no LLM wait)
    await Promise.all([
      fetch(`${COORDINATOR}/api/admin/pre-generate`, { method: 'POST' }),
      fetch(`${VARIANT}/api/admin/pre-generate`, { method: 'POST' }),
    ]);

    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    const pageCoord = await browser.newPage();
    const pageVariant = await browser.newPage();

    await Promise.all([
      pageCoord.goto(COORDINATOR),
      pageVariant.goto(VARIANT),
    ]);

    const storyCoord = pageCoord.locator('#story-text');
    const storyVariant = pageVariant.locator('#story-text');

    const startTime = Date.now();
    const [timeCoord, timeVariant] = await Promise.all([
      storyCoord.waitFor({ state: 'visible', timeout: 15000 }).then(() => Date.now() - startTime),
      storyVariant.waitFor({ state: 'visible', timeout: 15000 }).then(() => Date.now() - startTime),
    ]);

    const drift = Math.abs(timeCoord - timeVariant);
    console.log(`Coordinator visible at ${timeCoord}ms, Variant at ${timeVariant}ms, drift: ${drift}ms`);

    // With pre-generated content, drift should only be poll interval timing (~2s)
    expect(drift).toBeLessThan(5000);

    await pageCoord.close();
    await pageVariant.close();
  });

  test('vote buttons appear after story loads', async ({ page }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });
    await page.goto(VARIANT);

    await expect(page.locator('#story-text')).toBeVisible({ timeout: 45000 });

    const voteButtons = page.locator('#vote-buttons');
    await expect(voteButtons).toHaveClass(/active/);

    const thumbsUp = page.locator('[data-vote="thumbs_up"]');
    const thumbsDown = page.locator('[data-vote="thumbs_down"]');
    await expect(thumbsUp).toBeEnabled();
    await expect(thumbsDown).toBeEnabled();
  });

  test('voting locks the buttons and shows selection', async ({ page }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });
    await page.goto(VARIANT);

    await expect(page.locator('#story-text')).toBeVisible({ timeout: 45000 });

    await page.click('[data-vote="thumbs_up"]');

    await expect(page.locator('[data-vote="thumbs_up"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-vote="thumbs_down"]')).toHaveClass(/dimmed/);

    await expect(page.locator('[data-vote="thumbs_up"]')).toBeDisabled();
    await expect(page.locator('[data-vote="thumbs_down"]')).toBeDisabled();
  });

  test('admin reset snaps audience back to welcome screen', async ({ browser }) => {
    const pageCoord = await browser.newPage();
    const pageVariant = await browser.newPage();

    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    await Promise.all([
      pageCoord.goto(COORDINATOR),
      pageVariant.goto(VARIANT),
    ]);

    // Wait for story text to appear on both pages
    await Promise.all([
      expect(pageCoord.locator('#story-text')).toBeVisible({ timeout: 60000 }),
      expect(pageVariant.locator('#story-text')).toBeVisible({ timeout: 60000 }),
    ]);

    // Reset via coordinator (forwards to variant too)
    await fetch(`${COORDINATOR}/api/admin/reset`, { method: 'POST' });

    // Both pages should poll back to welcome state within a few poll cycles
    await Promise.all([
      expect(pageCoord.locator('#welcome')).not.toHaveClass(/hidden/, { timeout: 15000 }),
      expect(pageVariant.locator('#welcome')).not.toHaveClass(/hidden/, { timeout: 15000 }),
    ]);

    // Story section should no longer be active and story text should be hidden
    await expect(pageCoord.locator('#story')).not.toHaveClass(/active/);
    await expect(pageVariant.locator('#story')).not.toHaveClass(/active/);
    await expect(pageCoord.locator('#story-text')).not.toBeVisible();
    await expect(pageVariant.locator('#story-text')).not.toBeVisible();

    await pageCoord.close();
    await pageVariant.close();
  });

  test('late joiner sees the current part immediately', async ({ page }) => {
    // Advance to Part 3
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    // Wait for Part 3 to be generated (poll status until sharedStoryParts includes 3)
    const waitForPart3 = async () => {
      for (let i = 0; i < 60; i++) {
        const status = await fetch(`${VARIANT}/api/story/status`).then(r => r.json());
        if (status.sharedStoryParts.includes(3)) return;
        await new Promise(r => setTimeout(r, 1000));
      }
      throw new Error('Part 3 never became available');
    };
    await waitForPart3();

    // Open a fresh audience page — should land on Part 3 directly
    await page.goto(VARIANT);

    const storyText = page.locator('#story-text');
    await expect(storyText).toBeVisible({ timeout: 15000 });

    const progressText = await page.locator('#progress').textContent();
    expect(progressText).toContain('Part 3 of 5');
  });

  test('vote produces correct API response with telemetry data', async ({ browser }) => {
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    const page = await browser.newPage();
    await page.goto(VARIANT);
    await expect(page.locator('#story-text')).toBeVisible({ timeout: 60000 });

    // Intercept the vote request to inspect the payload
    let capturedRequest = null;
    await page.route('**/api/story/1/vote', async (route) => {
      capturedRequest = {
        body: JSON.parse(route.request().postData()),
      };
      // Let the request continue to the server
      const response = await route.fetch();
      const responseBody = await response.json();
      capturedRequest.response = responseBody;
      await route.fulfill({ response });
    });

    // Click thumbs up
    await page.click('[data-vote="thumbs_up"]');

    // Wait for the vote request to complete
    await expect(page.locator('[data-vote="thumbs_up"]')).toHaveClass(/selected/, { timeout: 5000 });

    // Verify the intercepted request body
    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest.body.vote).toBe('thumbs_up');
    expect(capturedRequest.body.responseId).toBeTruthy();
    expect(capturedRequest.body.spanContext).toBeTruthy();

    // Verify the API response
    expect(capturedRequest.response.part).toBe(1);
    expect(capturedRequest.response.vote).toBe('thumbs_up');

    await page.close();

    // Second page: thumbs down vote
    const page2 = await browser.newPage();
    await page2.goto(COORDINATOR);
    await expect(page2.locator('#story-text')).toBeVisible({ timeout: 60000 });

    let capturedRequest2 = null;
    await page2.route('**/api/story/1/vote', async (route) => {
      capturedRequest2 = {
        body: JSON.parse(route.request().postData()),
      };
      const response = await route.fetch();
      const responseBody = await response.json();
      capturedRequest2.response = responseBody;
      await route.fulfill({ response });
    });

    await page2.click('[data-vote="thumbs_down"]');
    await expect(page2.locator('[data-vote="thumbs_down"]')).toHaveClass(/selected/, { timeout: 5000 });

    expect(capturedRequest2).not.toBeNull();
    expect(capturedRequest2.body.vote).toBe('thumbs_down');
    expect(capturedRequest2.response.vote).toBe('thumbs_down');

    await page2.close();
  });
});
