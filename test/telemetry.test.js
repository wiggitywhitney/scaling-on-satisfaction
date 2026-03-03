// ABOUTME: Tests for OTel telemetry instrumentation
// ABOUTME: Verifies gen_ai.evaluation.result span events with correct attributes
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@opentelemetry/api', () => {
  const mockSpan = {
    addEvent: vi.fn(),
    end: vi.fn(),
    spanContext: vi.fn().mockReturnValue({
      traceId: 'abc123',
      spanId: 'def456',
      traceFlags: 1,
    }),
  };

  const mockTracer = {
    startActiveSpan: vi.fn((name, options, fn) => {
      return fn(mockSpan);
    }),
  };

  return {
    trace: {
      getTracer: vi.fn(() => mockTracer),
    },
    SpanKind: { CLIENT: 2, INTERNAL: 0 },
    SpanStatusCode: { UNSET: 0, OK: 1, ERROR: 2 },
    _mockTracer: mockTracer,
    _mockSpan: mockSpan,
  };
});

import { getTracer, emitEvaluationEvent } from '../src/telemetry.js';
import { _mockTracer, _mockSpan } from '@opentelemetry/api';

describe('telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTracer', () => {
    it('returns a tracer with the app name', () => {
      const tracer = getTracer();
      expect(tracer).toBe(_mockTracer);
    });
  });

  describe('emitEvaluationEvent', () => {
    it('creates a span linked to the generation span context', () => {
      const generationSpanContext = {
        traceId: 'gen_trace_001',
        spanId: 'gen_span_001',
        traceFlags: 1,
      };

      emitEvaluationEvent({
        vote: 'thumbs_up',
        responseId: 'msg_abc123',
        generationSpanContext,
      });

      expect(_mockTracer.startActiveSpan).toHaveBeenCalledOnce();
      const [name, options] = _mockTracer.startActiveSpan.mock.calls[0];
      expect(name).toBe('evaluate UserSatisfaction');
      expect(options.links).toEqual([{ context: generationSpanContext }]);
    });

    it('adds gen_ai.evaluation.result event with thumbs_up attributes', () => {
      emitEvaluationEvent({
        vote: 'thumbs_up',
        responseId: 'msg_abc123',
        generationSpanContext: { traceId: 't', spanId: 's', traceFlags: 1 },
      });

      expect(_mockSpan.addEvent).toHaveBeenCalledOnce();
      const [eventName, attributes] = _mockSpan.addEvent.mock.calls[0];
      expect(eventName).toBe('gen_ai.evaluation.result');
      expect(attributes['gen_ai.evaluation.name']).toBe('UserSatisfaction');
      expect(attributes['gen_ai.evaluation.score.label']).toBe('thumbs_up');
      expect(attributes['gen_ai.evaluation.score.value']).toBe(1.0);
      expect(attributes['gen_ai.response.id']).toBe('msg_abc123');
    });

    it('adds gen_ai.evaluation.result event with thumbs_down attributes', () => {
      emitEvaluationEvent({
        vote: 'thumbs_down',
        responseId: 'msg_xyz789',
        generationSpanContext: { traceId: 't', spanId: 's', traceFlags: 1 },
      });

      const [, attributes] = _mockSpan.addEvent.mock.calls[0];
      expect(attributes['gen_ai.evaluation.score.label']).toBe('thumbs_down');
      expect(attributes['gen_ai.evaluation.score.value']).toBe(0.0);
      expect(attributes['gen_ai.response.id']).toBe('msg_xyz789');
    });

    it('ends the span after adding the event', () => {
      emitEvaluationEvent({
        vote: 'thumbs_up',
        responseId: 'msg_001',
        generationSpanContext: { traceId: 't', spanId: 's', traceFlags: 1 },
      });

      expect(_mockSpan.addEvent).toHaveBeenCalledOnce();
      expect(_mockSpan.end).toHaveBeenCalledOnce();
    });

    it('creates span without links when generationSpanContext is null', () => {
      emitEvaluationEvent({
        vote: 'thumbs_up',
        responseId: 'msg_001',
        generationSpanContext: null,
      });

      const [, options] = _mockTracer.startActiveSpan.mock.calls[0];
      expect(options.links).toEqual([]);
    });
  });
});
