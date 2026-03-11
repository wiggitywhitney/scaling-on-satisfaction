// ABOUTME: E2E walkthrough of Round 1 (moon/space) — dry vs funny style variants
// ABOUTME: Advances through all 5 parts, verifies story delivery and voting on both variants

import { test, expect } from '@playwright/test';

const COORDINATOR = 'http://localhost:8080'; // Admin panel + audience app (variant A)
const VARIANT = 'http://localhost:8081';     // Audience app only (variant B)
const TOTAL_PARTS = 5;

test.describe('Round 1 Full Walkthrough', () => {
  let isRound1 = false;

  test.beforeAll(async () => {
    // Check if instances are configured for Round 1
    const coordStatus = await fetch(`${COORDINATOR}/api/admin/status`).then(r => r.json());
    isRound1 = coordStatus.round === 1;
  });

  test.beforeEach(async () => {
    await fetch(`${COORDINATOR}/api/admin/reset`, { method: 'POST' });
    await fetch(`${VARIANT}/api/admin/reset`, { method: 'POST' });
  });

  test('admin variant labels show Round 1 style names', async ({ page }) => {
    test.skip(!isRound1, 'Servers not configured for Round 1');
    await page.goto(`${COORDINATOR}/admin`);
    await expect(page.locator('.variant-card')).toHaveCount(2, { timeout: 10000 });

    const cards = page.locator('.variant-card');
    // Coordinator is one variant (this instance)
    await expect(cards.nth(0)).toContainText('Round 1');
    await expect(cards.nth(0)).toContainText('this instance');

    // The remote variant should show its style name
    const card1Text = await cards.nth(1).textContent();
    expect(card1Text).toMatch(/Funny|Dry/);
  });

  test('advance through all 5 parts — both variants show stories', async ({ browser }) => {
    test.skip(!isRound1, 'Servers not configured for Round 1');
    const adminPage = await browser.newPage();
    const audienceCoord = await browser.newPage();
    const audienceVariant = await browser.newPage();

    await adminPage.goto(`${COORDINATOR}/admin`);
    await audienceCoord.goto(COORDINATOR);
    await audienceVariant.goto(VARIANT);

    // Wait for admin to load
    await expect(adminPage.locator('#status')).toContainText('0 / 5', { timeout: 5000 });

    for (let part = 1; part <= TOTAL_PARTS; part++) {
      await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

      await expect(adminPage.locator('#status')).toContainText(`${part} / ${TOTAL_PARTS}`, { timeout: 10000 });

      const textCoord = audienceCoord.locator('#story-text');
      const textVariant = audienceVariant.locator('#story-text');

      // Wait for progress to update (poll interval + generation time)
      await expect(audienceCoord.locator('#progress')).toContainText(`Part ${part} of ${TOTAL_PARTS}`, { timeout: 60000 });
      await expect(audienceVariant.locator('#progress')).toContainText(`Part ${part} of ${TOTAL_PARTS}`, { timeout: 60000 });

      await expect(textCoord).toBeVisible({ timeout: 10000 });
      await expect(textVariant).toBeVisible({ timeout: 10000 });

      // Verify story text is substantive
      const contentCoord = await textCoord.textContent();
      const contentVariant = await textVariant.textContent();
      expect(contentCoord.length).toBeGreaterThan(50);
      expect(contentVariant.length).toBeGreaterThan(50);

      // Stories should differ between variants (different styles produce different text)
      expect(contentCoord).not.toBe(contentVariant);

      // Vote on each part (thumbs up on coordinator, thumbs down on variant for variety)
      if (part < TOTAL_PARTS) {
        await audienceCoord.click('[data-vote="thumbs_up"]');
        await expect(audienceCoord.locator('[data-vote="thumbs_up"]')).toHaveClass(/selected/, { timeout: 5000 });

        await audienceVariant.click('[data-vote="thumbs_down"]');
        await expect(audienceVariant.locator('[data-vote="thumbs_down"]')).toHaveClass(/selected/, { timeout: 5000 });
      }
    }

    // After all 5 parts, advance button should be disabled
    await expect(adminPage.locator('#btn-advance')).toBeDisabled();

    await adminPage.close();
    await audienceCoord.close();
    await audienceVariant.close();
  });

  test('vote on final part works', async ({ page }) => {
    test.skip(!isRound1, 'Servers not configured for Round 1');
    // Advance to part 5
    for (let i = 0; i < TOTAL_PARTS; i++) {
      await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });
    }

    await page.goto(VARIANT);
    await expect(page.locator('#story-text')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('#progress')).toContainText(`Part ${TOTAL_PARTS} of ${TOTAL_PARTS}`);

    // Vote on final part
    await page.click('[data-vote="thumbs_down"]');
    await expect(page.locator('[data-vote="thumbs_down"]')).toHaveClass(/selected/, { timeout: 5000 });
    await expect(page.locator('[data-vote="thumbs_up"]')).toHaveClass(/dimmed/);
  });
});
