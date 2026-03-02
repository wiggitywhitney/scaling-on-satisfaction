# Scaling on Satisfaction

Demo apps for "Scaling on Satisfaction: Automated Rollouts Driven by User Feedback" — a KubeCon EU 2026 talk (Platform Engineering Day, March 23) co-presented with Thomas Vitale.

A mobile-friendly web app that serves multi-part GenAI stories, collects audience thumbs-up/down votes, and emits votes as `gen_ai.evaluation.result` OTel span events. Deployed as 4 container images across 2 demo rounds. OTel Collector count connector transforms feedback events into Prometheus metrics that Flagger consumes to shift Knative traffic.

## Project Constraints

- **JavaScript only** — not TypeScript. This is a demo, not a production app.
- **Anthropic SDK** for LLM calls. May make vendor-agnostic later but start with Anthropic.
- **Whitney's scope only** — Thomas Vitale owns the platform (Knative, Flagger, Contour, OTel Collector, etc.). This repo contains the demo apps and audience-facing web UI.
- **OTel API only** — follow the global CLAUDE.md rule. The app emits `gen_ai.evaluation.result` span events using the OTel API. The deployer (Thomas's platform) provides the SDK.
- **Same story arc across variants** — both variants in each round tell the same story beats in the same order. Only style (Round 1) or model quality (Round 2) differs.

## Tech Stack

- **Language**: JavaScript (ES modules)
- **Runtime**: Node.js
- **LLM**: Anthropic SDK (`@anthropic-ai/sdk`)
- **Telemetry**: OpenTelemetry API (`@opentelemetry/api`)
- **Container**: Docker (4 images, 2 per round)

## Development Setup

```bash
# Install dependencies
npm install

# Run with secrets injected
vals exec -f .vals.yaml -- node src/index.js
```

## Secrets Management

This project uses vals for secrets. See `.vals.yaml` for available secrets.

## Testing

Tests use Vitest. Run with `npm test`.

## Completion Checklist

- OTel span events emitted with correct `gen_ai.evaluation.result` attributes
- Story continuity preserved across variants (same arc, different style/model)
- Mobile-friendly UI renders correctly on phone browsers
- Container images build and run
- Built-in 75s pacing per story part (60s vote + 15s resolve)
