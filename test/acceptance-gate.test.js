// ABOUTME: Acceptance gate test — calls real Anthropic API to verify story generation
// ABOUTME: Runs on PR creation via pre-pr hook; advisory only, never blocks

import { describe, it, expect } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { createGenerator } from '../src/story/generator.js';

const API_KEY_AVAILABLE = !!process.env.ANTHROPIC_API_KEY;

describe.skipIf(!API_KEY_AVAILABLE)('Acceptance Gate — Story Generation', () => {
  const client = API_KEY_AVAILABLE
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

  it('generates a Round 1 funny story part', { timeout: 30_000 }, async () => {
    const generator = createGenerator(client);
    const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514', 1);

    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(50);
    expect(result.responseId).toBeTruthy();
    expect(result.responseId).toMatch(/^msg_/);
    expect(result.spanContext).toBeDefined();
  });

  it('generates a Round 1 dry story part', { timeout: 30_000 }, async () => {
    const generator = createGenerator(client);
    const result = await generator.generatePart(1, 'dry', 'claude-sonnet-4-20250514', 1);

    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(50);
    expect(result.responseId).toMatch(/^msg_/);
  });

  it('generates a Round 2 funny story part', { timeout: 30_000 }, async () => {
    const generator = createGenerator(client);
    const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514', 2);

    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(50);
    expect(result.responseId).toMatch(/^msg_/);
  });

  it('story text is roughly within word target (~100 words)', { timeout: 30_000 }, async () => {
    const generator = createGenerator(client);
    const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514', 1);

    const wordCount = result.text.split(/\s+/).filter(Boolean).length;
    // Allow generous range — LLMs aren't precise, but should be in the ballpark
    expect(wordCount).toBeGreaterThan(50);
    expect(wordCount).toBeLessThan(200);
  });
});
