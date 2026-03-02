import { buildPrompt } from './prompts.js';
import { getTracer } from '../telemetry.js';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';

export function createGenerator(client) {
  const tracer = getTracer();

  return {
    async generatePart(partNumber, style, model) {
      const prompt = buildPrompt(partNumber, style);

      return tracer.startActiveSpan(`chat ${model}`, {
        kind: SpanKind.CLIENT,
        attributes: {
          'gen_ai.operation.name': 'chat',
          'gen_ai.request.model': model,
        },
      }, async (span) => {
        try {
          const response = await client.messages.create({
            model,
            max_tokens: 1024,
            system: prompt.system,
            messages: [{ role: 'user', content: prompt.user }],
          });

          span.setAttribute('gen_ai.response.id', response.id);
          span.end();

          return {
            text: response.content[0].text,
            responseId: response.id,
            spanContext: span.spanContext(),
          };
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          span.end();
          throw error;
        }
      });
    },
  };
}
