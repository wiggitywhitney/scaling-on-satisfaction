# PRD #16: Gen AI Semantic Convention Telemetry

**GitHub Issue**: [#16](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/16)
**Priority**: Medium
**Target**: Before KubeCon EU 2026 demo

## Problem

The app's generation span (`chat <model>` in `src/story/generator.js`) is missing several attributes defined by the OTel gen_ai semantic conventions (v1.37+). Specifically:

- `gen_ai.provider.name` (required) — not set
- `gen_ai.response.model` (recommended) — not set
- `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens` (recommended) — available in Anthropic response but not read
- `gen_ai.request.max_tokens` (recommended) — passed to API but not set as span attribute
- Prompt/completion content — not captured as span events

Without these, LLM observability tools can identify the span as a gen_ai call (because of `gen_ai.operation.name=chat`) but cannot show token usage, cost tracking, model details, or prompt/response content.

## Solution

Add the missing gen_ai semantic convention attributes to the generation span. All data is already available in the Anthropic SDK response object — it just needs to be read and set as span attributes. Optionally, add a `gen_ai.client.inference.operation.details` span event to capture prompt and completion content.

## Current State

The generation span in `src/story/generator.js` currently sets:

| Attribute | Status |
|---|---|
| `gen_ai.operation.name` = "chat" | Set |
| `gen_ai.request.model` | Set |
| `gen_ai.response.id` | Set |
| Span kind = CLIENT | Set |
| Span name = `chat {model}` | Set |
| `gen_ai.provider.name` | **Missing** |
| `gen_ai.response.model` | **Missing** |
| `gen_ai.usage.input_tokens` | **Missing** |
| `gen_ai.usage.output_tokens` | **Missing** |
| `gen_ai.request.max_tokens` | **Missing** |
| Prompt/completion content | **Missing** |

The evaluation span event in `src/telemetry.js` already follows the gen_ai semantic conventions correctly (`gen_ai.evaluation.result` with `score.label`, `score.value`, `story.part`). No changes needed there.

## Milestones

- [x] **M1: Add required and recommended span attributes** — Add `gen_ai.provider.name`, `gen_ai.response.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, and `gen_ai.request.max_tokens` to the generation span in `src/story/generator.js`. All values come from the existing Anthropic SDK response object.

- [ ] **M2: Add prompt/completion content capture** — Add a `gen_ai.client.inference.operation.details` span event to the generation span with `gen_ai.input.messages` (system + user prompt) and `gen_ai.output.messages` (assistant response). This is opt-in and may have privacy implications — consider whether to enable by default or behind an env var.

- [ ] **M3: Rebuild and push container images** — Rebuild all four Docker images (`story-app-1a`, `story-app-1b`, `story-app-2a`, `story-app-2b`) with the updated code and push to Docker Hub.

- [ ] **M4: Verify in Datadog** — With Thomas's cluster running, confirm that the generation spans appear with full attributes in Datadog APM. Verify token counts, model name, and provider are visible on the span.

## Technical Notes

- The app uses `@opentelemetry/api` only (no SDK). The OTel Operator injects the SDK via auto-instrumentation. This means the app controls which attributes are set — the auto-instrumentation handles export.
- The Anthropic SDK response object includes `response.model`, `response.usage.input_tokens`, and `response.usage.output_tokens`. These are already returned by the API call; the app just doesn't read them.
- The existing OTel Collector in kubecon-2026-gitops already has a Datadog exporter. No collector changes should be needed — Datadog auto-recognizes gen_ai spans based on semantic convention attributes.

## Out of Scope

- Changes to the evaluation span (`src/telemetry.js`) — already compliant
- OTel Collector configuration changes — should work as-is
- Datadog dashboard modifications
- Adding the Datadog LLM Observability SDK — we use OTel native instrumentation, not vendor SDKs

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-16 | Use OTel gen_ai semantic conventions, not Datadog SDK | The app is already instrumented with OTel. Adding vendor-specific SDKs would conflict with the OTel-native approach and the talk's message. |
| 2026-03-16 | Prompt/completion capture opt-in (M2 separate from M1) | Privacy consideration — prompts may contain sensitive content. Separate milestone so M1 can ship independently. |
