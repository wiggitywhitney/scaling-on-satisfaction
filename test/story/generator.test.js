// ABOUTME: Tests for the Anthropic SDK story generator
// ABOUTME: Verifies LLM call contract, prompt construction, and error handling
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSpan = {
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
  addEvent: vi.fn(),
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

function mockAnthropicResponse(overrides = {}) {
  return {
    id: 'msg_default',
    model: 'claude-sonnet-4-20250514',
    content: [{ type: 'text', text: 'Default story text.' }],
    usage: { input_tokens: 100, output_tokens: 50 },
    ...overrides,
  };
}

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
    mockClient.messages.create.mockResolvedValue(
      mockAnthropicResponse({
        id: 'msg_test123',
        content: [{ type: 'text', text: 'Once upon a time on the moon...' }],
      })
    );

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
    mockClient.messages.create.mockResolvedValue(
      mockAnthropicResponse({
        id: 'msg_abc123',
        content: [{ type: 'text', text: 'The platform engineer landed softly...' }],
      })
    );

    const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

    expect(result.text).toBe('The platform engineer landed softly...');
    expect(result.responseId).toBe('msg_abc123');
  });

  it('strips leaked word count from story text', async () => {
    mockClient.messages.create.mockResolvedValue(
      mockAnthropicResponse({
        id: 'msg_wc1',
        content: [{ type: 'text', text: 'The clock didn\'t care. Neither did the water.\n\n**Word count: 100**' }],
      })
    );

    const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

    expect(result.text).toBe('The clock didn\'t care. Neither did the water.');
  });

  it('strips unbolded word count from story text', async () => {
    mockClient.messages.create.mockResolvedValue(
      mockAnthropicResponse({
        id: 'msg_wc2',
        content: [{ type: 'text', text: 'Story ending here.\n\nWord count: 98' }],
      })
    );

    const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

    expect(result.text).toBe('Story ending here.');
  });

  it('does not modify text without word count leak', async () => {
    mockClient.messages.create.mockResolvedValue(
      mockAnthropicResponse({
        id: 'msg_clean',
        content: [{ type: 'text', text: 'A perfectly clean story.' }],
      })
    );

    const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

    expect(result.text).toBe('A perfectly clean story.');
  });

  it('throws on API error without fallback', async () => {
    mockClient.messages.create.mockRejectedValue(new Error('API rate limit exceeded'));

    await expect(generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514'))
      .rejects.toThrow('API rate limit exceeded');
  });

  it('throws when response has no text block', async () => {
    mockClient.messages.create.mockResolvedValue({
      id: 'msg_no_text',
      model: 'claude-sonnet-4-20250514',
      content: [{ type: 'tool_use', id: 'tool_1', name: 'test' }],
      usage: { input_tokens: 50, output_tokens: 0 },
    });

    await expect(generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514'))
      .rejects.toThrow('did not contain a text block');
  });

  it('passes the correct style through to prompt', async () => {
    mockClient.messages.create.mockResolvedValue(
      mockAnthropicResponse({
        id: 'msg_dry',
        content: [{ type: 'text', text: 'A formal account...' }],
      })
    );

    await generator.generatePart(1, 'dry', 'claude-sonnet-4-20250514');

    const callArgs = mockClient.messages.create.mock.calls[0][0];
    expect(callArgs.system).toMatch(/dry|academic|formal/i);
  });

  it('uses the specified model', async () => {
    mockClient.messages.create.mockResolvedValue(
      mockAnthropicResponse({
        id: 'msg_haiku',
        model: 'claude-haiku-4-5-20251001',
        content: [{ type: 'text', text: 'Quick story...' }],
      })
    );

    await generator.generatePart(1, 'funny', 'claude-haiku-4-5-20251001');

    const callArgs = mockClient.messages.create.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-haiku-4-5-20251001');
  });

  describe('OTel instrumentation', () => {
    it('returns spanContext alongside text and responseId', async () => {
      mockClient.messages.create.mockResolvedValue(
        mockAnthropicResponse({
          id: 'msg_span_test',
          content: [{ type: 'text', text: 'Instrumented story...' }],
        })
      );

      const result = await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

      expect(result.spanContext).toEqual({
        traceId: 'gen_trace_001',
        spanId: 'gen_span_001',
        traceFlags: 1,
      });
    });

    it('creates a CLIENT span with GenAI attributes', async () => {
      mockClient.messages.create.mockResolvedValue(
        mockAnthropicResponse({ id: 'msg_attrs' })
      );

      await generator.generatePart(3, 'dry', 'claude-sonnet-4-20250514');

      expect(mockTracer.startActiveSpan).toHaveBeenCalledOnce();
      const [name, options] = mockTracer.startActiveSpan.mock.calls[0];
      expect(name).toBe('chat claude-sonnet-4-20250514');
      expect(options.kind).toBe(2); // SpanKind.CLIENT
      expect(options.attributes['gen_ai.operation.name']).toBe('chat');
      expect(options.attributes['gen_ai.request.model']).toBe('claude-sonnet-4-20250514');
      expect(options.attributes['gen_ai.provider.name']).toBe('anthropic');
      expect(options.attributes['gen_ai.request.max_tokens']).toBe(300);
    });

    it('sets gen_ai.response.model from API response', async () => {
      mockClient.messages.create.mockResolvedValue(
        mockAnthropicResponse({
          id: 'msg_model',
          model: 'claude-sonnet-4-20250514',
          usage: { input_tokens: 200, output_tokens: 80 },
        })
      );

      await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.model', 'claude-sonnet-4-20250514');
    });

    it('sets token usage attributes from API response', async () => {
      mockClient.messages.create.mockResolvedValue(
        mockAnthropicResponse({
          id: 'msg_tokens',
          usage: { input_tokens: 512, output_tokens: 150 },
        })
      );

      await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.usage.input_tokens', 512);
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.usage.output_tokens', 150);
    });

    it('sets gen_ai.response.id on the span after API call', async () => {
      mockClient.messages.create.mockResolvedValue(
        mockAnthropicResponse({ id: 'msg_resp_id' })
      );

      await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('gen_ai.response.id', 'msg_resp_id');
    });

    it('emits gen_ai.client.inference.operation.details event with prompt and completion', async () => {
      mockClient.messages.create.mockResolvedValue(
        mockAnthropicResponse({
          id: 'msg_event',
          content: [{ type: 'text', text: 'The story unfolds...' }],
        })
      );

      await generator.generatePart(1, 'funny', 'claude-sonnet-4-20250514');

      expect(mockSpan.addEvent).toHaveBeenCalledWith(
        'gen_ai.client.inference.operation.details',
        expect.objectContaining({
          'gen_ai.input.messages': expect.any(String),
          'gen_ai.output.messages': expect.any(String),
        })
      );

      const eventCall = mockSpan.addEvent.mock.calls.find(
        c => c[0] === 'gen_ai.client.inference.operation.details'
      );
      const inputMessages = JSON.parse(eventCall[1]['gen_ai.input.messages']);
      expect(inputMessages).toEqual(expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user' }),
      ]));

      const outputMessages = JSON.parse(eventCall[1]['gen_ai.output.messages']);
      expect(outputMessages).toEqual([
        expect.objectContaining({ role: 'assistant', content: 'The story unfolds...' }),
      ]);
    });

    it('ends the span after successful generation', async () => {
      mockClient.messages.create.mockResolvedValue(
        mockAnthropicResponse({ id: 'msg_end' })
      );

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
