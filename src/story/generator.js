// ABOUTME: Story generation via Anthropic SDK with OTel-traced LLM calls
// ABOUTME: Creates a generator that produces story parts using the story bible approach
import { buildPrompt } from './prompts.js';
import { getTracer } from '../telemetry.js';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';

export function createGenerator(client) {
  const tracer = getTracer();

  return {
    async generatePart(partNumber, style, model, round = 1) {
      const prompt = buildPrompt(partNumber, style, round);

      return tracer.startActiveSpan(`chat ${model}`, {
        kind: SpanKind.CLIENT,
        attributes: {
          'gen_ai.operation.name': 'chat',
          'gen_ai.request.model': model,
          'gen_ai.provider.name': 'anthropic',
          'gen_ai.request.max_tokens': 300,
        },
      }, async (span) => {
        try {
          const response = await client.messages.create({
            model,
            max_tokens: 300,
            system: prompt.system,
            messages: [{ role: 'user', content: prompt.user }],
          });

          const textBlock = response?.content?.find(
            (block) => block?.type === 'text' && typeof block.text === 'string'
          );
          if (!textBlock) {
            throw new Error('Anthropic response did not contain a text block');
          }

          span.setAttribute('gen_ai.response.id', response.id);
          span.setAttribute('gen_ai.response.model', response.model);
          span.setAttribute('gen_ai.usage.input_tokens', response.usage.input_tokens);
          span.setAttribute('gen_ai.usage.output_tokens', response.usage.output_tokens);

          // Strip leaked prompt artifacts (e.g. "**Word count: 100**")
          const cleanText = textBlock.text
            .replace(/\n*\*{0,2}\s*[Ww]ord\s*count[:\s]*\d+\s*\*{0,2}\s*$/m, '')
            .trim();

          return {
            text: cleanText,
            responseId: response.id,
            spanContext: span.spanContext(),
          };
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          throw error;
        } finally {
          span.end();
        }
      });
    },
  };
}
