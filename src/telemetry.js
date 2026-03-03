// ABOUTME: OTel instrumentation for gen_ai.evaluation.result span events
// ABOUTME: Emits thumbs-up/down votes as OTel events correlated to generation spans
import { trace, SpanKind } from '@opentelemetry/api';

const TRACER_NAME = 'scaling-on-satisfaction';

export function getTracer() {
  return trace.getTracer(TRACER_NAME);
}

export function emitEvaluationEvent({ vote, responseId, generationSpanContext }) {
  const tracer = getTracer();
  const links = generationSpanContext ? [{ context: generationSpanContext }] : [];

  tracer.startActiveSpan('evaluate UserSatisfaction', { links }, (span) => {
    span.addEvent('gen_ai.evaluation.result', {
      'gen_ai.evaluation.name': 'UserSatisfaction',
      'gen_ai.evaluation.score.label': vote,
      'gen_ai.evaluation.score.value': vote === 'thumbs_up' ? 1.0 : 0.0,
      'gen_ai.response.id': responseId,
    });
    span.end();
  });
}
