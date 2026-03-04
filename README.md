# Scaling on Satisfaction

Demo apps for **["Scaling on Satisfaction: Automated Rollouts Driven by User Feedback"](https://sched.co/2DY2c)**, a KubeCon EU 2026 talk (Platform Engineering Day, March 23) co-presented by Whitney Lee and Thomas Vitale.

A mobile-friendly web app that serves multi-part GenAI stories, collects audience thumbs-up/down votes, and emits votes as OpenTelemetry span events. Deployed as 4 container images across 2 demo rounds. An OTel Collector count connector transforms feedback events into Prometheus metrics that Flagger consumes to shift Knative traffic. Audience-powered rollout to the most popular variant.

## Demo Structure

### Round 1: A/B Test (Prompt Variants)

**Theme:** "Platform Engineer on the Moon"

Two apps tell the same 5-part story with different prompt styles. Same model, same beats, different tone.

| App | Style | Model |
|-----|-------|-------|
| 1a  | Dry, academic paper-speak | Anthropic (same) |
| 1b  | Funny and engaging | Anthropic (same) |

Starting split: 50/50. Flagger shifts traffic toward the variant with higher satisfaction.

### Round 2: Canary Deployment (Model Upgrade)

**Theme:** "Developer at the Clown Native Computing Foundation Circus"

Two apps use the winning style from Round 1 but different models. Tests whether the expensive model is worth the cost.

| App | Style | Model |
|-----|-------|-------|
| 2a  | Winning style from Round 1 | Haiku 4.5 (cheap) |
| 2b  | Winning style from Round 1 | Opus 4.6 (expensive) |

Starting split: 100/0 (everyone on cheap). Flagger canary-deploys the expensive model to a small percentage and shifts traffic if it scores higher.

### How It Works

Each audience member loads the app on their phone. The presenter advances the story one part at a time. For each part:

1. The audience member's phone requests the next story part
2. The app generates a unique version via the Anthropic API
3. The audience reads the story and votes thumbs up or thumbs down
4. The vote emits a `gen_ai.evaluation.result` OTel span event
5. The OTel Collector counts votes per variant as Prometheus metrics
6. Flagger reads the metrics and shifts Knative traffic toward the winner

## Container Images

Pre-built images are available on Docker Hub:

| Image | Round | Style | Model |
|-------|-------|-------|-------|
| `wiggitywhitney/story-app-1a:latest` | 1 | Dry, academic | Claude Sonnet 4 |
| `wiggitywhitney/story-app-1b:latest` | 1 | Funny, engaging | Claude Sonnet 4 |
| `wiggitywhitney/story-app-2a:latest` | 2 | Funny (configurable) | Claude Haiku 4.5 |
| `wiggitywhitney/story-app-2b:latest` | 2 | Funny (configurable) | Claude Opus 4.6 |

Pull all images:

```bash
docker pull wiggitywhitney/story-app-1a:latest
docker pull wiggitywhitney/story-app-1b:latest
docker pull wiggitywhitney/story-app-2a:latest
docker pull wiggitywhitney/story-app-2b:latest
```

## Prerequisites

- An [Anthropic API key](https://console.anthropic.com/)
- Docker

## Running Locally

Run a single variant:

```bash
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY \
  wiggitywhitney/story-app-1b:latest
```

Run a Round 1 pair with coordinated admin controls:

```bash
# Start both variants
docker run -d -p 8081:8080 -e ANTHROPIC_API_KEY --name app-1a wiggitywhitney/story-app-1a:latest
docker run -d -p 8082:8080 -e ANTHROPIC_API_KEY --name app-1b \
  -e VARIANT_URLS=http://app-1a:8080 \
  wiggitywhitney/story-app-1b:latest

# Advance/reset both from app-1b's admin at http://localhost:8082/admin
```

This assumes `ANTHROPIC_API_KEY` is already set in your shell. The audience UI is at `http://localhost:<port>` and presenter controls are at `/admin`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | | Anthropic API key for story generation |
| `PORT` | `8080` | HTTP listen port |

All other configuration (`VARIANT_STYLE`, `VARIANT_MODEL`, `ROUND`) is baked into container images at build time via the build scripts.

## Building Container Images

### Round 1: Prompt Variants

Builds two images with different prompt styles (same model):

```bash
./scripts/build-round1.sh [registry] [tag]
```

| Image | Style |
|-------|-------|
| `{registry}-1a:{tag}` | Dry, academic |
| `{registry}-1b:{tag}` | Funny, engaging |

Example:

```bash
./scripts/build-round1.sh wiggitywhitney/story-app latest
# → wiggitywhitney/story-app-1a:latest
# → wiggitywhitney/story-app-1b:latest
```

### Round 2: Model Variants

Builds two images with different models (same prompt style). Pass the winning style from Round 1 as the third argument:

```bash
./scripts/build-round2.sh [registry] [tag] [style]
```

| Image | Model |
|-------|-------|
| `{registry}-2a:{tag}` | Haiku 4.5 (cheap) |
| `{registry}-2b:{tag}` | Opus 4.6 (expensive) |

Example:

```bash
./scripts/build-round2.sh wiggitywhitney/story-app latest funny
# → wiggitywhitney/story-app-2a:latest
# → wiggitywhitney/story-app-2b:latest
```

## Admin Controls

The presenter controls story pacing from `/admin`. The audience UI at `/` polls the server and auto-loads each new part when the presenter advances.

- **Advance**: moves all variants to the next story part
- **Reset**: clears all audience sessions and returns to the welcome screen

When `ADMIN_SECRET` is set, the presenter bookmarks `/admin?secret=<value>` and mutation endpoints require the secret automatically.

When `VARIANT_URLS` is set, a single advance/reset command forwards to all variant servers. The admin page shows per-variant status with sync indicators.

## Platform Integration

### Health Probes

| Probe | Path | Behavior |
|-------|------|----------|
| Liveness | `GET /healthz` | Always returns `200 OK` |
| Readiness | `GET /readyz` | Returns `200 OK`, or `503` during graceful shutdown |

### OTel Event: `gen_ai.evaluation.result`

Each vote emits a span event with these attributes:

| Attribute | Value |
|-----------|-------|
| `gen_ai.evaluation.name` | `UserSatisfaction` |
| `gen_ai.evaluation.score.label` | `thumbs_up` or `thumbs_down` |
| `gen_ai.evaluation.score.value` | `1.0` or `0.0` |
| `gen_ai.response.id` | ID of the generation being evaluated |

The evaluation span is linked to the GenAI operation span via span links.

### Multi-Variant Admin Coordination

Set `VARIANT_URLS` on one variant instance to act as the coordinator. When the presenter advances or resets from that instance's `/admin`, it forwards the command to all listed variants:

```bash
VARIANT_URLS=http://app-1a:8080,http://app-1b:8080
```
