# Scaling on Satisfaction

Demo apps for **["Scaling on Satisfaction: Automated Rollouts Driven by User Feedback"](https://sched.co/2DY2c)**, a KubeCon EU 2026 talk (Platform Engineering Day, March 23) co-presented by Whitney Lee and Thomas Vitale.

A mobile-friendly web app that serves multi-part GenAI stories, collects audience thumbs-up/down votes, and emits votes as OpenTelemetry span events. Deployed as 4 container images across 2 demo rounds. An OTel Collector count connector transforms feedback events into Prometheus metrics that Flagger consumes to shift Knative traffic. Audience-powered rollout to the most popular variant.

## Demo Structure

### Round 1: A/B Test (Prompt Variants)

**Theme:** "Platform Engineer on the Moon"
**Character:** Nyx Vasquez — a panicky platform engineer who narrates their own disasters in real time but somehow always lands on their feet.

Two apps tell the same 5-part story (~100 words per part) with different prompt styles. Same model, same beats, different tone.

| App | Style | Model |
|-----|-------|-------|
| 1a  | Dry, academic paper-speak | Anthropic (same) |
| 1b  | Funny and engaging | Anthropic (same) |

Starting split: 50/50. Flagger shifts traffic toward the variant with higher satisfaction.

### Round 2: Canary Deployment (Model Upgrade)

**Theme:** "Developer at the Clown Native Computing Foundation Circus"
**Character:** Rae Okonkwo — a backend developer and keyboard warrior, completely out of their element performing a Houdini act at the circus.

Two apps use the winning style from Round 1 but different models. Same 5-part story (~100 words per part). Tests whether the expensive model is worth the cost.

| App | Style | Model |
|-----|-------|-------|
| 2a  | Winning style from Round 1 | Haiku 4.5 (cheap) |
| 2b  | Winning style from Round 1 | Opus 4.6 (expensive) |

Starting split: 100/0 (everyone on cheap). Flagger canary-deploys the expensive model to a small percentage and shifts traffic if it scores higher.

### How It Works

Before the demo, the presenter pre-generates all 5 story parts for each variant via the admin panel. All audience members see the same story text per variant — no per-user generation.

During the demo, the presenter advances the story one part at a time. For each part:

1. The audience member's phone requests the next story part
2. The app serves the shared pre-generated story for that variant
3. The audience reads the story and votes thumbs up or thumbs down
4. The vote emits a `gen_ai.evaluation.result` OTel span event with a `story.part` attribute
5. The OTel Collector counts votes per variant as Prometheus metrics
6. Flagger reads the metrics and shifts Knative traffic toward the winner

## Container Images

Pre-built images are available on Docker Hub:

| Image | Round | Style | Model |
|-------|-------|-------|-------|
| `wiggitywhitney/story-app-1a:latest` | 1 | Dry, academic | Claude Sonnet 4 |
| `wiggitywhitney/story-app-1b:latest` | 1 | Funny, engaging | Claude Sonnet 4 |
| `wiggitywhitney/story-app-2a:latest` | 2 | Funny | Claude Haiku 4.5 |
| `wiggitywhitney/story-app-2b:latest` | 2 | Funny | Claude Opus 4.6 |

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
# Create a shared network for container-name DNS resolution
docker network create story-net

# Start both variants
docker run -d --network story-net -p 8081:8080 -e ANTHROPIC_API_KEY --name app-1a wiggitywhitney/story-app-1a:latest
docker run -d --network story-net -p 8082:8080 -e ANTHROPIC_API_KEY --name app-1b \
  -e VARIANT_URLS=http://app-1a:8080 \
  wiggitywhitney/story-app-1b:latest

# Pre-generate, advance, and reset both from app-1b's admin at http://localhost:8082/admin
```

This assumes `ANTHROPIC_API_KEY` is already set in your shell. The audience UI is at `http://localhost:<port>` and presenter controls are at `/admin`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | | Anthropic API key for story generation |
| `PORT` | `8080` | HTTP listen port |
| `VARIANT_URLS` | | Comma-separated URLs of other variant instances for coordinated admin controls |
| `VARIANT_LABELS` | | Comma-separated display labels for variant instances in the admin panel |
| `ADMIN_SECRET` | | Secret for authenticating admin mutation endpoints |
| `PREGEN_DELAY_MS` | `2000` | Stagger delay before background pre-generation starts (avoids rate-limit competition when variants share an API key) |
| `PREGEN_RETRY_DELAY_MS` | `5000` | Delay before retrying a failed background pre-generation |

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

Builds two images with different models (same prompt style, hardcoded to `funny`):

```bash
./scripts/build-round2.sh [registry] [tag]
```

| Image | Model |
|-------|-------|
| `{registry}-2a:{tag}` | Haiku 4.5 (cheap) |
| `{registry}-2b:{tag}` | Opus 4.6 (expensive) |

Example:

```bash
./scripts/build-round2.sh wiggitywhitney/story-app latest
# → wiggitywhitney/story-app-2a:latest
# → wiggitywhitney/story-app-2b:latest
```

## Admin Controls

The presenter controls story pacing from `/admin`. The audience UI at `/` polls the server and auto-loads each new part when the presenter advances.

- **Pre-generate**: generates all 5 story parts for this variant and all coordinated variants (backstage prep before the demo starts)
- **Advance**: moves all variants to the next story part
- **Reset**: clears all pre-generated stories and returns to the welcome screen

When `ADMIN_SECRET` is set, the presenter bookmarks `/admin?secret=<value>` and mutation endpoints require the secret automatically.

When `VARIANT_URLS` is set, a single pre-generate/advance/reset command forwards to all variant servers. The admin page shows per-variant status with sync indicators.

## Shared Story Serving

During the live demo, both variants need their stories ready before the audience sees content. Rather than generating stories on the fly, the presenter pre-generates all 5 parts backstage before the demo starts.

The pre-generate command (available from the admin panel or `POST /api/admin/pre-generate`) generates each part sequentially and interleaves across coordinated variants — part 1 on all variants before part 2, so if interrupted, both variants are ready to the same point. Two variants sharing one Anthropic API key stagger their generation using `PREGEN_DELAY_MS` to avoid rate-limit competition.

If a part hasn't been pre-generated when an audience member requests it, the app falls back to on-demand generation with in-flight deduplication — concurrent requests for the same part share a single LLM call, and the result is stored for all subsequent users.

## Stateless Architecture

The app has no per-user sessions. All audience members receive the same pre-generated story text for their variant. Vote context (`responseId`, `spanContext`) is sent to the client with the story response and returned by the client when submitting a vote — the server stores nothing per-user.

This means Flagger can scale replicas up and down freely. Any replica can serve any request with no sticky sessions or shared state required.

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
| `story.part` | Story part number (1–5) for per-part satisfaction analysis |

The evaluation span is linked to the GenAI operation span via span links.

### Multi-Variant Admin Coordination

Set `VARIANT_URLS` on one variant instance to act as the coordinator. When the presenter advances or resets from that instance's `/admin`, it forwards the command to all listed variants:

```bash
VARIANT_URLS=http://app-1a:8080,http://app-1b:8080
```
