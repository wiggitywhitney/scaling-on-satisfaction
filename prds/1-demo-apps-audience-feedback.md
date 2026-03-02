# PRD #1: Demo Apps & Audience Feedback Pipeline

**GitHub Issue**: [#1](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/1)
**Status**: Not Started
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
4. Paces story parts with built-in timers (60s read+vote, 15s Flagger resolve)
5. Deploys as 4 container images (2 per round)

Thomas Vitale owns the platform: Knative, Flagger, OTel Collector (count connector → Prometheus metrics), Contour, and traffic splitting. Whitney's apps emit OTel events and serve HTTP requests.

## Demo Structure

### Round 1: A/B Test (Prompt Variants)

**Theme**: "Platform Engineer in Space" (never crashes, no gravity)

| Variant | Prompt Style | Model |
|---------|-------------|-------|
| App 1a | Dry, academic paper-speak | Same (Anthropic) |
| App 1b | Funny and engaging | Same (Anthropic) |

- Starting split: 50/50
- 5 story parts, audience votes each part
- Flagger shifts traffic toward the variant with higher satisfaction
- Outcome not predetermined — audience decides

### Round 2: Canary Deployment (Model Upgrade)

**Theme**: "Platform Engineer Underwater" (fights a squid)

| Variant | Prompt Style | Model |
|---------|-------------|-------|
| App 2a | Winning style from Round 1 | Cheap model |
| App 2b | Winning style from Round 1 | Expensive/better model |

- Starting split: 100/0 (everyone on cheap)
- Better model canary-deployed to small percentage
- Flagger shifts traffic if better model scores higher
- Key insight: if cheap model wins, the upgrade isn't worth the cost

### Pacing Per Story Part

- 60 seconds: audience reads and votes
- 15 seconds: Flagger resolves and shifts traffic
- ~75 seconds per part, fully automatic
- Optional presenter gate (nice-to-have): admin endpoint to pause/advance timer for live talk pacing

### Story Arc Continuity

Both variants in each round tell the same story beats in the same order. Only the style (Round 1) or model quality (Round 2) differs. Audience members can switch between variants between parts without noticing.

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

- 4 app variants (2 per round) as container images
- Mobile-friendly web UI (story display + voting)
- Story generation via Anthropic SDK
- OTel instrumentation emitting `gen_ai.evaluation.result` events
- Built-in pacing timer (60s + 15s per part)
- Optional presenter gate endpoint

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
- [ ] 4 container images build and deploy to Knative
- [ ] Story continuity preserved when switching between variants
- [ ] Built-in pacing timer works (60s vote + 15s resolve)
- [ ] Round 1 and Round 2 demonstrate distinct patterns (A/B vs canary)
- [ ] Full pipeline works end-to-end: vote → OTel event → Prometheus metric → Flagger traffic shift

## Milestones

### M1: Core Story App (Target: March 4)
Single app that generates a 5-part story via Anthropic SDK, serves it on a mobile-friendly web page, and lets the user read parts sequentially. No voting yet, no OTel. Just the story engine and UI working.

- [ ] Express server serving a mobile-friendly page
- [ ] Anthropic SDK generating story parts with a fixed story arc
- [ ] User can read part 1, then advance to part 2, etc.
- [ ] Built-in timer between parts (60s countdown)
- [ ] Containerized with Dockerfile

### M2: Voting + OTel Instrumentation
Add thumbs-up/down voting to each story part. Emit `gen_ai.evaluation.result` OTel span events with correct attributes.

- [ ] Vote buttons on each story part
- [ ] OTel API instrumentation emitting evaluation events
- [ ] Events include correct attributes (evaluation name, score label/value, response ID)
- [ ] Events correlated to the generation span

### M3: Prompt Variants (Round 1 Apps)
Create the two Round 1 variants: same story arc, different prompt styles (dry/academic vs funny/engaging). Build as separate container images.

- [ ] App 1a: dry/academic prompt producing the space story
- [ ] App 1b: funny/engaging prompt producing the same space story
- [ ] Both share the same story arc (same beats, different style)
- [ ] Two Dockerfiles or build args producing two images

### M4: Model Variants (Round 2 Apps)
Create the two Round 2 variants: same prompt (winning style from Round 1), different models (cheap vs expensive). Build as separate container images.

- [ ] App 2a: cheap model with underwater story
- [ ] App 2b: expensive model with underwater story
- [ ] Same prompt template, configurable model selection
- [ ] Two container images

### M5: Presenter Gate (Nice-to-Have)
Admin endpoint to pause or advance the built-in timer for live talk pacing control.

- [ ] Admin endpoint (e.g., `/admin/advance`, `/admin/pause`)
- [ ] Simple auth (shared secret or local-only)
- [ ] Timer state visible on admin page

### M6: Integration Testing with Thomas's Platform
End-to-end testing on Thomas's Knative + Flagger platform.

- [ ] Apps deploy to Knative and serve traffic
- [ ] OTel events reach the Collector
- [ ] Count connector produces Prometheus metrics
- [ ] Flagger reads metrics and shifts traffic
- [ ] Full round plays through successfully

### M7: Datadog Dashboards
Create dashboards showing satisfaction scores, traffic split, and Flagger decisions.

- [ ] Satisfaction score by variant over time
- [ ] Traffic split visualization
- [ ] Flagger decision log

### M8: Talk Rehearsal
Practice the full 25-minute talk with both rounds working.

- [ ] Both rounds complete within time budget
- [ ] Story pacing feels natural
- [ ] Dashboard reveals work at the right moments
- [ ] Fallback plan if something breaks live

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-19 | Story concept: "A Kubernetes developer deploys their stateful app in space" | Fun, relatable to audience, space theme allows creative freedom |
| 2026-02-19 | Round 1: prompt variants (dry/academic vs funny/engaging), Round 2: model upgrade | Avoids vendor benchmarking in Round 1; Round 2 tests a realistic cost question |
| 2026-02-25 | JavaScript, not TypeScript | Demo simplicity, faster iteration |
| 2026-02-25 | Anthropic SDK for LLM calls | May make vendor-agnostic later |
| 2026-02-25 | Datadog as observability backend | Whitney works at Datadog; Thomas's platform ships OTel to any endpoint |
| 2026-02-27 | Use Flagger canary strategy, NOT A/B testing | Flagger A/B testing is header/cookie-based routing. Canary strategy does metric-driven progressive traffic shifting, which is what we need. |
| 2026-02-27 | OTel count connector for events → metrics | Counts span events by name/attributes, produces Prometheus counters. Cleaner than spanmetrics connector for this use case. |
| 2026-02-27 | Built-in 75s timer per part (60s vote + 15s resolve) | Automatic pacing; presenter gate is nice-to-have, not required |
| 2026-02-27 | Same story arc across variants | Ensures continuity when audience members switch variants between parts |

## Research

- [GenAI Semantic Conventions](../abstracts/Scaling-on-Satisfaction/genai-semantic-conventions.md) — `gen_ai.evaluation.result` event spec
- [OTel GenAI Auto-Instrumentation Roadmap](../abstracts/Scaling-on-Satisfaction/auto-instrumentation-roadmap.md) — JS instrumentation landscape
- [Flagger Timing Research](../abstracts/Scaling-on-Satisfaction/flagger-timing-research.md) — analysis intervals, stepWeights, count connector, live demo feasibility

## Dependencies

- Thomas Vitale's platform must be ready for M6 integration testing
- Anthropic API key (managed via vals)
- Next meeting with Thomas: Wednesday, March 4
