// ABOUTME: Tests for the Anthropic SDK story generator
// ABOUTME: Verifies LLM call contract, prompt construction, and error handling
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSpan = {
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
  spanContext: vi.fn().mockReturnValue({
    traceId: 'gen_trace_001',
    spanId: 'gen_span_001',
    traceFlags: 1,
  }),
};

const mockTracer = {
  startActiveSpan: vi.fn((name, options, fn) => fn(mockSpan)),
};

vi.mock('@opentelemetry/api', () => ({
  trace: { getTracer: vi.fn(() => mockTracer) },
  SpanKind: { CLIENT: 2, INTERNAL: 0 },
  SpanStatusCode: { UNSET: 0, OK: 1, ERROR: 2 },
}));

import { createGenerator } from '../../src/story/generator.js';

describe('generator', () => {
  let mockClient;
  let generator;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSpan.spanContext.mockReturnValue({
      traceId: 'gen_trace_001',
      spanId: 'gen_span_001',
      traceFlags: 1,
    });
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

  describe('OTel instrumentation', () => {
    it('returns spanContext alongside text and responseId', async () => {
      mockClient.messages.create.mockResolvedValue({
        id: 'msg_span_test',
        content: [{ type: 'text', text: 'Instrumented story...' }],
      });

      const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

      expect(result.spanContext).toEqual({
        traceId: 'gen_trace_001',
        spanId: 'gen_span_001',
        traceFlags: 1,
      });
    });

    it('creates a CLIENT span with GenAI attributes', async () => {
      mockClient.messages.create.mockResolvedValue({
        id: 'msg_attrs',
        content: [{ type: 'text', text: 'Story...' }],
      });

      await generator.generatePart(3, 'dry', 'claude-sonnet-4-20250514');

      expect(mockTracer.startActiveSpan).toHaveBeenCalledOnce();
      const [name, options] = mockTracer.startActiveSpan.mock.calls[0];
      expect(name).toBe('chat claude-sonnet-4-20250514');
      expect(options.kind).toBe(2); // SpanKind.CLIENT
      expect(options.attributes['gen_ai.operation.name']).toBe('chat');
      expect(options.attributes['gen_ai.request.model']).toBe('claude-sonnet-4-20250514');
    });

    it('sets gen_ai.response.id on the span after API call', async () => {
      mockClient.messages.create.mockResolvedValue({
        id: 'msg_resp_id',
        content: [{ type: 'text', text: 'Story...' }],
      });

      await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.id', 'msg_resp_id');
    });

    it('ends the span after successful generation', async () => {
      mockClient.messages.create.mockResolvedValue({
        id: 'msg_end',
        content: [{ type: 'text', text: 'Story...' }],
      });

      await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

      expect(mockSpan.end).toHaveBeenCalledOnce();
    });

    it('records exception and sets error status on failure', async () => {
      const error = new Error('API rate limit exceeded');
      mockClient.messages.create.mockRejectedValue(error);

      await expect(generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514'))
        .rejects.toThrow('API rate limit exceeded');

      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 2, message: 'API rate limit exceeded' });
      expect(mockSpan.end).toHaveBeenCalledOnce();
    });
  });
});
