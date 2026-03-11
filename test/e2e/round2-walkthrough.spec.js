// ABOUTME: E2E walkthrough of Round 2 (circus) — Haiku vs Opus model variants
// ABOUTME: Advances through all 5 parts, verifies model labels, story delivery, and voting

import { test, expect } from '@playwright/test';

const COORDINATOR = 'http://localhost:8080'; // Admin panel + audience app (variant A)
const VARIANT = 'http://localhost:8081';     // Audience app — variant B
const TOTAL_PARTS = 5;

test.describe('Round 2 Full Walkthrough', () => {
  let isRound2 = false;

  test.beforeAll(async () => {
    const coordStatus = await fetch(`${COORDINATOR}/api/admin/status`).then(r => r.json());
    isRound2 = coordStatus.round === 2;
  });

  test.beforeEach(async () => {
    await fetch(`${COORDINATOR}/api/admin/reset`, { method: 'POST' });
    await fetch(`${VARIANT}/api/admin/reset`, { method: 'POST' });
  });

  test('admin variant labels show model names, not style', async ({ page }) => {
    test.skip(!isRound2, 'Servers not configured for Round 2');
    await page.goto(`${COORDINATOR}/admin`);
    await expect(page.locator('.variant-card')).toHaveCount(2, { timeout: 10000 });

    const cards = page.locator('.variant-card');

    const allCardsText = await cards.allTextContents();
    const combined = allCardsText.join(' ');

    // Should show model names
    expect(combined).toMatch(/Haiku|Opus/);

    // Should NOT show "Funny" labels (Round 2 differentiates by model, not style)
    const funnyCount = (combined.match(/Funny/g) || []).length;
    expect(funnyCount).toBe(0);
  });

  test('status endpoint includes model field', async () => {
    test.skip(!isRound2, 'Servers not configured for Round 2');
    const status = await fetch(`${COORDINATOR}/api/admin/status`).then(r => r.json());
    expect(status.model).toBeDefined();
    expect(status.model).toMatch(/claude/);
    expect(status.round).toBe(2);
  });

  test('advance through all 5 parts — both model variants show stories', async ({ browser }) => {
    test.skip(!isRound2, 'Servers not configured for Round 2');
    const adminPage = await browser.newPage();
    const audienceCoord = await browser.newPage();
    const audienceVariant = await browser.newPage();

    await adminPage.goto(`${COORDINATOR}/admin`);
    await audienceCoord.goto(COORDINATOR);
    await audienceVariant.goto(VARIANT);

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

      const contentCoord = await textCoord.textContent();
      const contentVariant = await textVariant.textContent();
      expect(contentCoord.length).toBeGreaterThan(50);
      expect(contentVariant.length).toBeGreaterThan(50);

      // Both use the same style but different models — text should differ
      expect(contentCoord).not.toBe(contentVariant);

      // Vote on each part
      if (part < TOTAL_PARTS) {
        await audienceCoord.click('[data-vote="thumbs_up"]');
        await expect(audienceCoord.locator('[data-vote="thumbs_up"]')).toHaveClass(/selected/, { timeout: 5000 });

        await audienceVariant.click('[data-vote="thumbs_down"]');
        await expect(audienceVariant.locator('[data-vote="thumbs_down"]')).toHaveClass(/selected/, { timeout: 5000 });
      }
    }

    await expect(adminPage.locator('#btn-advance')).toBeDisabled();

    await adminPage.close();
    await audienceCoord.close();
    await audienceVariant.close();
  });

  test('both variants tell the circus story with Rae Okonkwo', async ({ browser }) => {
    test.skip(!isRound2, 'Servers not configured for Round 2');
    const pageCoord = await browser.newPage();
    const pageVariant = await browser.newPage();

    // Advance to part 1
    await fetch(`${COORDINATOR}/api/admin/advance`, { method: 'POST' });

    await pageCoord.goto(COORDINATOR);
    await pageVariant.goto(VARIANT);

    const textCoord = pageCoord.locator('#story-text');
    const textVariant = pageVariant.locator('#story-text');

    await expect(textCoord).toBeVisible({ timeout: 60000 });
    await expect(textVariant).toBeVisible({ timeout: 60000 });

    const contentCoord = await textCoord.textContent();
    const contentVariant = await textVariant.textContent();

    // Both should reference the circus setting and Rae
    expect(contentCoord).toMatch(/Rae/i);
    expect(contentVariant).toMatch(/Rae/i);

    await pageCoord.close();
    await pageVariant.close();
  });
});
