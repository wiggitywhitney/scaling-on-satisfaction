# PRD #1: Demo Apps & Audience Feedback Pipeline

**GitHub Issue**: [#1](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/1)
**Status**: In Progress
**Priority**: High
**Talk Date**: March 23, 2026 (Platform Engineering Day EU, 25 minutes)
**First App Deadline**: March 4, 2026

## Problem

Whitney needs 4 JavaScript demo apps and an audience-facing web UI for a 25-minute live demo at Platform Engineering Day EU. The audience participates on their phones, reading GenAI-generated story parts and voting thumbs up/down. Their feedback drives automated canary rollouts via Flagger — the audience collectively migrates to the winning variant without knowing it.

## Solution

Build a mobile-friendly web app that:
1. Serves a multi-part GenAI story (same arc across variants, different style or model quality)
2. Collects thumbs-up/down votes per story part
3. Emits votes as `gen_ai.evaluation.result` OTel span events correlated to model, prompt, and conversation context
4. Paces story parts via presenter-controlled advancement (no auto-timer)
5. Deploys as 4 container images (2 per round)

Thomas Vitale owns the platform: Knative, Flagger, OTel Collector (count connector → Prometheus metrics), Contour, and traffic splitting. Whitney's apps emit OTel events and serve HTTP requests.

## Demo Structure

### Round 1: A/B Test (Prompt Variants)

**Theme**: "Platform Engineer on the Moon"

| Variant | Prompt Style | Model |
|---------|-------------|-------|
| App 1a | Dry, academic paper-speak | Same (Anthropic) |
| App 1b | Funny and engaging | Same (Anthropic) |

- Starting split: 50/50
- 5 story parts, audience votes each part
- Flagger shifts traffic toward the variant with higher satisfaction
- Outcome not predetermined — audience decides
- Gender-neutral protagonist (use "they" or "the platform engineer")

**Round 1 Story Beats** (escalating problems → bittersweet victory → alien reveal):

1. **Setup** — Platform engineer arrives on the moon. They don't know why they've been sent — it's a mystery mission. They start setting up a platform because that's what they do. Physical absurdity of IT work on the moon (spacesuit, moon dust, no atmosphere).
2. **Problem: servers float away (cliffhanger)** — Low gravity (one-sixth Earth's) means servers drift off the rack and float away. Cascading pod failures, the engineer chases floating hardware. Ends unsolved — the audience is left wondering how they'll fix it.
3. **Problem: CI/CD on Earth (cliffhanger)** — Every git push triggers a pipeline 384,000 km away on Earth. Speed-of-light round-trip delay (~2.5s per request) makes deployments take hours. Ends unsolved — stacked on top of the still-unsolved floating servers.
4. **Bittersweet victory** — First half: the engineer solves BOTH problems with creative moon-specific solutions (the solutions should be inventive and satisfying). Second half: the platform is a masterpiece but nobody is here to use it. The engineer fills out their own satisfaction survey. Loneliness on the moon with a perfect platform. This should ache.
5. **Alien reveal + appreciation** — Alien developers emerge. The LLM has creative freedom to describe what the aliens look like, what their computing gear looks like, and what alien developers are like. The aliens start using the platform. They show appreciation in alien ways (not human gestures — something uniquely alien). It mattered after all. Over-the-top happy ending.

### Round 2: Canary Deployment (Model Upgrade)

**Theme**: "Developer at the Clown Native Computing Foundation Circus"

| Variant | Prompt Style | Model |
|---------|-------------|-------|
| App 2a | Winning style from Round 1 | Cheap model |
| App 2b | Winning style from Round 1 | Expensive/better model |

- Starting split: 100/0 (everyone on cheap)
- Better model canary-deployed to small percentage
- Flagger shifts traffic if better model scores higher
- Key insight: if cheap model wins, the upgrade isn't worth the cost
- Protagonist is a developer (not a platform engineer like Round 1)
- Always spell out "Clown Native Computing Foundation" — never abbreviate. Everywhere one might say "Cloud," say "Clown."
- No animal acts (no lion taming, elephants, etc.)
- Gender-neutral throughout — use "they" for the developer, cannonball, trapeze artist(s), clowns. Never assume gender for any character.

**Round 2 Story Beats** (Houdini water tank escape — developer deploys app before air runs out):

The developer is the Houdini act at the Clown Native Computing Foundation circus. They're locked in a glass water tank and must deploy an app before they run out of air. Circus acts happen around the tank — each act coincides with a platform capability that helps the deploy progress. The developer's physical state escalates (running out of breath → lightheaded → panicking → gasping). Platform engineering is the invisible superpower that makes the impossible deploy possible.

1. **Setup** — The developer arrives at the Clown Native Computing Foundation circus. They're introduced as the Houdini act — locked in a glass water tank, must deploy a working app before the air in their lungs runs out. They take a deep breath. The clock starts.
2. **Human cannonball with a Helm-et (cliffhanger)** — A human cannonball wearing a Helm-et fires across the big top. The developer, underwater, makes progress with Helm charts and service mesh routing — the deploy launches into the cluster. But they're running out of breath. Deploy isn't done yet. Cliffhanger.
3. **Trapeze artist in Flux (cliffhanger)** — A trapeze artist swings high above — they're in Flux. GitOps pulls the config into sync. The app needs security and compliance — Kyverno is the safety net below, secure and compliant by default. But the developer is getting lightheaded. Still not deployed. Cliffhanger.
4. **Clown car (cliffhanger)** — A tiny clown car rolls into the ring. An impossible number of clowns pour out — each one offering a different interface to the same Kubernetes API (CLI, UI, API, portal). One API, many interfaces. The developer is panicking now, vision blurring. Almost there.
5. **Finale — deploy + celebratory circus chaos** — The app deploys. The tank opens. The developer gasps for air as the crowd ROARS. The LLM has creative freedom to describe celebratory circus chaos — over-the-top spectacle, confetti, impossible acts. Must shout out the Clown Native Computing Foundation by name. The platform made the developer look like a superhero.

### Pacing Per Story Part

- Presenter-controlled: speakers advance parts when ready (no auto-timer)
- Audience sees a welcome screen until the presenter triggers Part 1
- Audience UI polls the server and auto-loads each new part when the presenter advances
- Flagger resolve time is handled naturally by the presenter waiting before advancing
- Admin page (`/admin`) shows current part, session count, and advance/reset controls

### Story Bible Approach

Each story part is generated by a separate LLM call (possibly from a different variant or instance). The LLM has no memory between parts. Continuity is enforced entirely through the prompt — each part's prompt must specify:

1. **What already happened** — summary of prior parts with specific details
2. **What happens in this part** — the specific beat with detail-level specifics
3. **What details to preserve** — named elements, established problems, character state
4. **The style** — dry/academic vs funny/engaging (Round 1) or model selection (Round 2)

Both variants in each round tell the same story beats in the same order. Only the style (Round 1) or model quality (Round 2) differs. Audience members can switch between variants between parts without noticing. Detail-level beats (not just "a problem happens" but the specific problem and its consequences) ensure both variants describe the same events.

## Technical Architecture

```text
Audience Phone → Knative (traffic split) → App Variant A or B
                                              ↓
                                         Story + Vote UI
                                              ↓
                                    OTel SDK (gen_ai.evaluation.result event)
                                              ↓
                                    OTel Collector (count connector)
                                              ↓
                                    Prometheus (thumbs_up/down counters by variant)
                                              ↓
                                    Flagger (reads metrics, shifts Knative traffic)
```

### OTel Event: `gen_ai.evaluation.result`

Per the [semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-events/):

| Attribute | Value |
|-----------|-------|
| `gen_ai.evaluation.name` | `UserSatisfaction` |
| `gen_ai.evaluation.score.label` | `thumbs_up` or `thumbs_down` |
| `gen_ai.evaluation.score.value` | `1.0` or `0.0` |
| `gen_ai.response.id` | ID of the generation being evaluated |

The event is parented to the GenAI operation span when possible, or correlated via `gen_ai.response.id`.

### What Whitney Builds (This Repo)

- 4 app variants (2 per round) as container images delivered to Thomas for Knative deployment
- Mobile-friendly web UI (story display + voting)
- Story generation via Anthropic SDK
- OTel instrumentation emitting `gen_ai.evaluation.result` events
- Presenter-controlled pacing via admin page (baked into each app image)
- Welcome screen for audience before story begins
- K8s-ready: health endpoints, graceful shutdown, non-root container, `$PORT` env var

### What Thomas Builds (His Platform)

- Knative serving + traffic splitting
- Flagger with custom Prometheus MetricTemplate
- OTel Collector with count connector (span events → Prometheus counters)
- Contour ingress
- Platform infrastructure (Kyverno, Carvel, Flux, Crossplane, Backstage, Cert Manager)

## Ownership Split

| Component | Owner |
|-----------|-------|
| Demo apps (4 container images) | Whitney |
| Mobile web UI + voting | Whitney |
| OTel instrumentation in apps | Whitney |
| Story generation (Anthropic SDK) | Whitney |
| Pacing mechanism | Whitney |
| Datadog dashboards | Whitney |
| Knative + Flagger | Thomas |
| OTel Collector config | Thomas |
| Platform infrastructure | Thomas |
| Canary CRD + MetricTemplate | Thomas |

## Success Criteria

- [ ] Audience can load the app on their phone and read a story part
- [ ] Voting emits correct `gen_ai.evaluation.result` OTel span events
- [ ] 4 container images build and deploy to Knative (K8s-ready: health probes, graceful shutdown, non-root)
- [ ] Story continuity preserved when switching between variants
- [ ] Presenter-controlled pacing works (admin advances, audience auto-loads)
- [ ] Round 1 and Round 2 demonstrate distinct patterns (A/B vs canary)
- [ ] Full pipeline works end-to-end: vote → OTel event → Prometheus metric → Flagger traffic shift

## Milestones

### M1: Core Story App (Target: March 4)
Single app that generates a 5-part story via Anthropic SDK, serves it on a mobile-friendly web page with presenter-controlled pacing. No voting yet, no OTel. Just the story engine, UI, and presenter controls working. Uses the story bible approach — each part's prompt contains full prior context and the specific beat for that part.

- [x] Express server serving a mobile-friendly page
- [x] Anthropic SDK generating story parts using story bible prompts (Round 1 moon story beats)
- [x] Welcome screen shown to audience until presenter starts
- [x] Presenter admin page (`/admin`) with advance/reset controls
- [x] Audience UI auto-loads new parts when presenter advances
- [x] Containerized with Dockerfile
- [x] `GET /healthz` liveness endpoint (simple 200 OK)
- [x] `GET /readyz` readiness endpoint (200 OK, 503 during shutdown)
- [x] Graceful SIGTERM shutdown (stop accepting connections, drain in-flight, exit 0)
- [x] Default port 8080 (Knative convention), configurable via `$PORT`
- [x] Dockerfile: non-root user (`USER 1000`), tini for signal forwarding

### M2: Voting + OTel Instrumentation
Add thumbs-up/down voting to each story part. Emit `gen_ai.evaluation.result` OTel span events with correct attributes.

- [x] Vote buttons on each story part
- [x] OTel API instrumentation emitting evaluation events
- [x] Events include correct attributes (evaluation name, score label/value, response ID)
- [x] Events correlated to the generation span

### M3: Prompt Variants (Round 1 Apps)
Create the two Round 1 variants: same story arc, different prompt styles (dry/academic vs funny/engaging). Build as separate container images.

- [x] App 1a: dry/academic prompt producing the space story
- [x] App 1b: funny/engaging prompt producing the same space story
- [x] Both share the same story arc (same beats, different style)
- [x] Two Dockerfiles or build args producing two images
- [x] Single admin page that advances both variants at once (Decision 17)

### M4: Model Variants (Round 2 Apps)
Create the two Round 2 variants: same prompt (winning style from Round 1), different models (cheap vs expensive). Circus/Houdini water tank theme. Build as separate container images.

- [x] Round 2 story bible prompts for circus/Houdini beats (Decision 18)
- [x] App 2a: cheap model with circus story
- [x] App 2b: expensive model with circus story
- [x] Same prompt template, configurable model selection
- [x] Two container images

### M5: Multi-Variant Admin (Nice-to-Have)
Single admin page that advances all variant apps simultaneously. Basic presenter gate is already in M1; this adds multi-variant coordination.

- [ ] Admin page accepts list of variant URLs via config (e.g., `VARIANT_URLS` env var)
- [ ] Single "Advance" button POSTs to all variant servers
- [ ] Status display shows current part for each variant
- [ ] Simple auth (shared secret or local-only)

### M6: Integration Testing with Thomas's Platform
End-to-end testing on Thomas's Knative + Flagger platform.

- [ ] Apps deploy to Knative and serve traffic
- [ ] OTel events reach the Collector
- [ ] Count connector produces Prometheus metrics
- [ ] Flagger reads metrics and shifts traffic
- [ ] Full round plays through successfully
- [ ] README: project overview, dev setup, build images, run locally (`/write-docs`)

### M7: Datadog Dashboards
Create dashboards showing satisfaction scores, traffic split, and Flagger decisions.

- [ ] Satisfaction score by variant over time
- [ ] Traffic split visualization
- [ ] Flagger decision log

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-19 | ~~Story concept: "A Kubernetes developer deploys their stateful app in space"~~ Superseded by 2026-03-02 moon story decision | ~~Fun, relatable to audience, space theme allows creative freedom~~ |
| 2026-02-19 | Round 1: prompt variants (dry/academic vs funny/engaging), Round 2: model upgrade | Avoids vendor benchmarking in Round 1; Round 2 tests a realistic cost question |
| 2026-02-25 | JavaScript, not TypeScript | Demo simplicity, faster iteration |
| 2026-02-25 | Anthropic SDK for LLM calls | May make vendor-agnostic later |
| 2026-02-25 | Datadog as observability backend | Whitney works at Datadog; Thomas's platform ships OTel to any endpoint |
| 2026-02-27 | Use Flagger canary strategy, NOT A/B testing | Flagger A/B testing is header/cookie-based routing. Canary strategy does metric-driven progressive traffic shifting, which is what we need. |
| 2026-02-27 | OTel count connector for events → metrics | Counts span events by name/attributes, produces Prometheus counters. Cleaner than spanmetrics connector for this use case. |
| 2026-02-27 | ~~Built-in 75s timer per part (60s vote + 15s resolve)~~ Superseded by 2026-03-02 presenter-only pacing | ~~Automatic pacing; presenter gate is nice-to-have, not required~~ |
| 2026-02-27 | Same story arc across variants | Ensures continuity when audience members switch variants between parts |
| 2026-03-02 | Round 1 setting: Moon (not generic space). Mystery mission, alien developer reveal in Part 5 | Moon gives specific physical comedy (low gravity, no atmosphere). Mystery-to-reveal arc creates emotional payoff. Aliens give LLM creative freedom. |
| 2026-03-02 | 5-part arc: Setup → Problem → Problem → Bittersweet victory → Alien reveal | Escalating problems build tension, Part 4 emotional low ("everything works, nothing matters") makes Part 5 reveal land harder |
| 2026-03-02 | Specific beats: floating servers (Part 2), CI/CD on Earth (Part 3), lonely perfect platform (Part 4), alien developers + alien appreciation (Part 5) | Concrete details ensure continuity across variants and LLM instances |
| 2026-03-02 | Story bible approach: each part's prompt contains full prior context and detail-level beat specifications | Different LLM instances generate different parts — no conversation memory. Continuity enforced through prompts, not chat history. |
| 2026-03-02 | Gender-neutral protagonist | Use "they" or "the platform engineer" throughout |
| 2026-03-02 | ~~Round 2 (underwater) needs same story bible treatment~~ Superseded by Decision 18 (circus/Houdini) | ~~Design detail-level beats before M4 implementation~~ |
| 2026-03-02 | ~~Built-in 75s timer per part~~ → Presenter-only pacing, no auto-timer | Timer created reading pressure for audience. Speakers control advancement; audience UI polls and auto-loads. M5 scope reduced to multi-variant coordination only. |
| 2026-03-02 | Story target ~150 words (max 175), physical-reality-first, puns, one metaphor max, moon-specific difficulties | 250 words was too dense for phone reading. Metaphor stacking buried the plot. Lead with what's physically happening before getting clever. |
| 2026-03-02 | "Houston, we have a problem" banned from system prompt | LLM reaches for this cliche every time. Explicitly banned. |
| 2026-03-02 | Parts 2-3 end as unsolved cliffhangers; Part 4 opens by solving both | Problems land harder when left hanging. Solutions are satisfying when delivered together. Part 4 has two halves: creative solutions → loneliness. |
| 2026-03-02 | Welcome screen for audience before story begins | Audience sees "Welcome to The Story Generator! Your story will begin soon." until presenter triggers Part 1. Better than a blank or loading state. |
| 2026-03-02 | Per-user story generation, non-streaming | Each audience member gets a unique LLM-generated story. Loading indicator → full text display (no streaming). |
| 2026-03-02 | (Decision 17) Single admin page advances all variants simultaneously | In M3+, the admin page sends advance to all variant URLs (configured via env var). One button, both apps move. Solves presenter UX for multi-variant demos. |
| 2026-03-02 | K8s readiness requirements added to PRD #1 (not a separate PRD) | Health endpoints (`/healthz`, `/readyz`), graceful SIGTERM shutdown, non-root Dockerfile with tini, default port 8080 via `$PORT`. Small mechanical changes that belong with the container image work, not a standalone PRD. |
| 2026-03-02 | Final deliverable: 4 container images with admin baked in, delivered to Thomas | Each image contains the full app including the admin page. Round 1: first 2 images deployed together. Round 2: second 2 images. Thomas deploys to Knative; Whitney delivers images. |
| 2026-03-02 | Style variants require separate system prompts AND separate beat descriptions | A single style instruction appended to a shared system prompt is insufficient — the model ignores it when surrounding instructions have comedy cues ("land a joke", "absurdity"). Each variant needs its own complete system prompt and beat descriptions written in the target register. Tested and confirmed: dry beats with academic language produce genuinely formal output; shared beats with a style toggle do not. |
| 2026-03-02 | Fail-fast on missing ANTHROPIC_API_KEY | Server was starting successfully without an API key and only failing on the first LLM request. Now exits immediately with a clear error. |
| 2026-03-02 | Dockerfile over Cloud Native Buildpacks for container images | Existing 11-line alpine Dockerfile already follows best practices (non-root, tini, production deps). Alpine images ~100-150MB vs Paketo's Ubuntu-based ~200-300MB. No new tooling dependency. Both produce OCI-compliant images Knative accepts. No reason to switch with a working Dockerfile and a 2-day deadline. |
| 2026-03-02 | (Decision 18) ~~Round 2 theme: "Platform Engineer Underwater" (fights a squid)~~ → Circus / Houdini water tank at the Clown Native Computing Foundation | "Clown Native Computing Foundation" (CNCF = Clown, not Cloud) is an instant KubeCon laugh. Houdini water tank gives ticking-clock tension. Circus setting provides rich visual comedy and CNCF tool wordplay for model quality differentiation (Round 2). |
| 2026-03-02 | Round 2 protagonist is a developer, not a platform engineer | Different from Round 1. Developer succeeds because of platform support — the talk's thesis. |
| 2026-03-02 | Always spell out "Clown Native Computing Foundation" — never abbreviate, never say "Cloud" | The joke only works if you say the full name. Everywhere CNCF appears, it's the Clown Native Computing Foundation. |
| 2026-03-02 | Round 2 beat structure: Setup → 3 circus acts → Finale. One act per part, clean structure (not overlapping chaos) | Each part pairs one circus act with one platform capability. Cannonball (Helm-et + service mesh), Trapeze (in Flux + Kyverno safety net), Clown car (one K8s API, many interfaces). Finale has LLM creative freedom for celebratory circus chaos. |
| 2026-03-02 | No animal circus acts | No lion taming, elephants, etc. — cruel to animals. Stick to human/clown/acrobat acts. |
| 2026-03-02 | Gender-neutral for all Round 2 characters | Use "they" for the developer, cannonball, trapeze artist(s), clowns — every character. Same principle as Round 1's gender-neutral protagonist, extended to the full cast. |
| 2026-03-02 | Developer physical state escalates across parts | Running out of breath → lightheaded → panicking → gasping for air. Built-in cliffhangers at each part boundary. |
| 2026-03-02 | ~~Round 2 (underwater) needs same story bible treatment~~ Superseded by Decision 18 | ~~Design detail-level beats before M4 implementation~~ Beats now designed as part of Decision 18. |
| 2026-03-02 | Round 2 models: Haiku 4.5 (`claude-haiku-4-5-20251001`) cheap, Opus 4.6 (`claude-opus-4-6`) expensive | 5x price difference ($1/$5 vs $5/$25 per MTok). Maximum quality contrast for "is the upgrade worth it?" demo framing. Haiku is fast/cheap; Opus is the frontier model. |

## Research

- [GenAI Semantic Conventions](../abstracts/Scaling-on-Satisfaction/genai-semantic-conventions.md) — `gen_ai.evaluation.result` event spec
- [OTel GenAI Auto-Instrumentation Roadmap](../abstracts/Scaling-on-Satisfaction/auto-instrumentation-roadmap.md) — JS instrumentation landscape
- [Flagger Timing Research](../abstracts/Scaling-on-Satisfaction/flagger-timing-research.md) — analysis intervals, stepWeights, count connector, live demo feasibility

## Dependencies

- Thomas Vitale's platform must be ready for M6 integration testing
- Anthropic API key (managed via vals)
- Next meeting with Thomas: Wednesday, March 4
