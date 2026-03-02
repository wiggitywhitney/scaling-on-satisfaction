import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGenerator } from '../../src/story/generator.js';

describe('generator', () => {
  let mockClient;
  let generator;

  beforeEach(() => {
    mockClient = {
      messages: {
        create: vi.fn(),
      },
    };
    generator = createGenerator(mockClient);
  });

  it('calls Anthropic SDK with correct parameters', async () => {
    mockClient.messages.create.mockResolvedValue({
      id: 'msg_test123',
      content: [{ type: 'text', text: 'Once upon a time on the moon...' }],
    });

    await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

    expect(mockClient.messages.create).toHaveBeenCalledOnce();
    const callArgs = mockClient.messages.create.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-sonnet-4-20250514');
    expect(callArgs.max_tokens).toBeGreaterThan(0);
    expect(callArgs.system).toBeDefined();
    expect(callArgs.messages).toEqual([
      { role: 'user', content: expect.any(String) },
    ]);
  });

  it('returns text and responseId from Anthropic response', async () => {
    mockClient.messages.create.mockResolvedValue({
      id: 'msg_abc123',
      content: [{ type: 'text', text: 'The platform engineer landed softly...' }],
    });

    const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

    expect(result.text).toBe('The platform engineer landed softly...');
    expect(result.responseId).toBe('msg_abc123');
  });

  it('throws on API error without fallback', async () => {
    mockClient.messages.create.mockRejectedValue(new Error('API rate limit exceeded'));

    await expect(generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514'))
      .rejects.toThrow('API rate limit exceeded');
  });

  it('passes the correct style through to prompt', async () => {
    mockClient.messages.create.mockResolvedValue({
      id: 'msg_dry',
      content: [{ type: 'text', text: 'A formal account...' }],
    });

    await generator.generatePart(1, 'dry', 'claude-sonnet-4-20250514');

    const callArgs = mockClient.messages.create.mock.calls[0][0];
    expect(callArgs.system).toMatch(/dry|academic|formal/i);
  });

  it('uses the specified model', async () => {
    mockClient.messages.create.mockResolvedValue({
      id: 'msg_haiku',
      content: [{ type: 'text', text: 'Quick story...' }],
    });

    await generator.generatePart(1, 'funny', 'claude-haiku-4-5-20251001');

    const callArgs = mockClient.messages.create.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-haiku-4-5-20251001');
  });
});
