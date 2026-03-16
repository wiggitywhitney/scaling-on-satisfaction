# Datadog LLM Observability — Integration Research

Research date: 2026-03-16. Based on the app's current OTel instrumentation and Datadog's LLM Observability OTel ingestion docs.

## Summary

The scaling-on-satisfaction app is **almost compatible** with Datadog LLM Observability out of the box. The generation span already has `gen_ai.operation.name=chat` and `gen_ai.request.model`, which Datadog recognizes as an LLM call. Adding 5-8 lines to `generator.js` would complete the integration.

## Current Instrumentation vs Requirements

### Generation span (`chat <model>`) in `src/story/generator.js`

| Attribute | App sets it? | v1.37+ requirement | Datadog LLM Obs mapping |
|---|---|---|---|
| `gen_ai.operation.name` = "chat" | Yes | Required | `meta.span.kind` → llm |
| `gen_ai.provider.name` | **No** | Required | `meta.model_provider` |
| `gen_ai.request.model` | Yes | Conditionally required | `meta.model_name` (fallback) |
| `gen_ai.response.model` | **No** | Recommended | `meta.model_name` (primary) |
| `gen_ai.response.id` | Yes | Recommended | — |
| `gen_ai.usage.input_tokens` | **No** | Recommended | `metrics.input_tokens` |
| `gen_ai.usage.output_tokens` | **No** | Recommended | `metrics.output_tokens` |
| `gen_ai.request.max_tokens` | **No** | Recommended | `metadata.max_tokens` |
| Span kind = CLIENT | Yes | Correct | — |
| Span name = `chat {model}` | Yes | Matches convention | `name` |

### Evaluation span event (`gen_ai.evaluation.result`) in `src/telemetry.js`

The span event format matches the OTel semantic convention name exactly. However, Datadog LLM Observability does **not** auto-ingest OTel evaluation span events as native evaluations. Evaluations must be submitted separately via the [Evaluations API](https://docs.datadoghq.com/llm_observability/evaluations/external_evaluations/) with `source:otel` tag and decimal-encoded span_id/trace_id.

For the KubeCon demo, this gap is acceptable — the votes are visible as span events in the APM trace view. They just won't appear in the LLM Obs "Evaluations" tab.

## Required App Code Changes

### `src/story/generator.js` — add to generation span

```javascript
// Add to span creation attributes:
'gen_ai.provider.name': 'anthropic',

// After the Anthropic response comes back, add:
span.setAttribute('gen_ai.response.model', response.model);
span.setAttribute('gen_ai.usage.input_tokens', response.usage.input_tokens);
span.setAttribute('gen_ai.usage.output_tokens', response.usage.output_tokens);
span.setAttribute('gen_ai.request.max_tokens', 300); // or whatever value is passed
```

### Optional: capture prompt/completion content

```javascript
// Add a span event for input/output (enables prompt/response visibility in LLM Obs)
span.addEvent('gen_ai.client.inference.operation.details', {
  'gen_ai.input.messages': JSON.stringify([
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ]),
  'gen_ai.output.messages': JSON.stringify([
    { role: 'assistant', content: cleanText }
  ]),
});
```

### Container image rebuild

After code changes, rebuild all four images:
- `wiggitywhitney/story-app-1a:latest`
- `wiggitywhitney/story-app-1b:latest`
- `wiggitywhitney/story-app-2a:latest`
- `wiggitywhitney/story-app-2b:latest`

## Infrastructure Changes

### Likely none required

The existing Datadog exporter in the OTel Collector (`opentelemetry-collector.yml` in kubecon-2026-gitops) already sends traces to Datadog. Datadog should auto-recognize gen_ai spans from the exporter based on the presence of gen_ai semantic convention attributes.

### Fallback if auto-recognition doesn't work

Add an `otlphttp` exporter to the collector config:

```yaml
exporters:
  otlphttp/llmobs:
    endpoint: "https://otlp.datadoghq.com"
    headers:
      dd-api-key: "${env:DD_API_KEY}"
      dd-otlp-source: "llmobs"
```

And add it to the traces pipeline:

```yaml
service:
  pipelines:
    traces:
      exporters: [spanmetrics, datadog/connector, datadog, otlphttp/llmobs]
```

## Presentation Strategy

### Organic fit in the talk

After showing the Datadog dashboard during the demo, switch to LLM Observability:
- "Because we used gen_ai semantic conventions, Datadog knows these are LLM calls"
- Show the model, token count, and prompt/response for a specific generation
- Natural "zoom in" from aggregate metrics to individual LLM interactions

### Recommendation

Use a **screenshot or pre-recorded clip** rather than a live demo. Avoids another thing that could break on conference WiFi. The real live demo stays on the dashboard and canary rollout.

## Sources

- [OTel GenAI Semantic Conventions - Spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/)
- [OTel GenAI Semantic Conventions - Events](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-events/)
- [Datadog: OTel Instrumentation for LLM Observability](https://docs.datadoghq.com/llm_observability/instrumentation/otel_instrumentation/)
- [Datadog Blog: LLM Observability + OTel GenAI Semantic Conventions](https://www.datadoghq.com/blog/llm-otel-semantic-convention/)
- [Datadog: External Evaluations API](https://docs.datadoghq.com/llm_observability/evaluations/external_evaluations/)
