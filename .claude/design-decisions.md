# Design Decisions & Anti-Regression Guide
**Generated:** 2026-03-02 13:07
**Project:** scaling-on-satisfaction

## CURRENT APPROACH

Building a mobile-friendly Node.js/Express web app that serves 5-part GenAI stories about a "Platform Engineer on the Moon." The app uses the Anthropic SDK to generate story parts from a deterministic story bible (hardcoded prior context, not chained LLM output). Presenter controls pacing via an admin page (`/admin`); audience sees a welcome screen until the presenter advances. Each variant runs as its own container image with admin baked in. 4 container images total (2 per demo round), delivered to Thomas Vitale for Knative deployment.

**Stack**: JavaScript (not TypeScript), ES modules, Express, Anthropic SDK, OTel API only, Vitest for tests, Docker for containers.

**Architecture**: `createGenerator(client)` and `createApiRouter(generator)` use dependency injection. Per-user sessions via cookie-based UUID with in-memory Map store. Server tracks `currentPart` globally; audience UI polls `/api/story/status` every 2s.

## REJECTED APPROACHES — DO NOT SUGGEST THESE

- **[REJECTED] Countdown timer for pacing**: Originally implemented a 60-second timer per story part with auto-advance. Removed entirely — replaced with presenter-only advancement. The speakers need to control pacing, not a timer. Do not re-add any timer-based pacing.
- **[REJECTED] TypeScript**: Project constraint is JavaScript only. This is a demo, not a production app. Do not convert to or suggest TypeScript.
- **[REJECTED] Chained LLM output for story continuity**: Prior context between story parts is hardcoded from the story bible, NOT taken from previous LLM responses. This ensures each part's prompt is fully deterministic and different variant instances can generate any part independently. Do not chain LLM outputs.
- **[REJECTED] Streaming LLM responses**: Non-streaming was chosen. Story parts are short (~150 words) so streaming adds complexity without benefit.
- **[REJECTED] Separate admin service/app**: Admin is baked into each app image, not a standalone service. The `/admin` page lives in the same Express server.
- **[REJECTED] Separate PRD for K8s readiness**: K8s readiness items (health endpoints, graceful shutdown, Dockerfile hardening) were added to PRD #1's M1 milestone, not a separate PRD.
- **[REJECTED] npm start in Dockerfile CMD**: Must use `node src/index.js` directly — npm swallows exit signals (SIGTERM).
- **[REJECTED] "Houston, we have a problem" in stories**: Explicitly banned in the system prompt. The LLM reaches for this cliche every time.
- **[REJECTED] Long/dense story parts (~250 words)**: Original prompts produced ~250 words of dense metaphor-stacked text. Reduced to ~150 words target, 175 hard cap, with "one extended metaphor max" rule.
- **[REJECTED] Admin routes at `/admin/*`**: Initially admin API was at `/admin/advance`, `/admin/reset` — this conflicted with serving `admin.html` at `/admin`. API routes moved to `/api/admin/*` so `/admin` serves the HTML page.
- **[REJECTED] Dependency checks in liveness probes**: K8s best practice — liveness should be simple 200 OK. If liveness checks external deps and they're down, K8s restart-loops your pods.

## KEY DESIGN DECISIONS

1. **Presenter-only pacing** — No timer. Presenter hits "Advance" on `/admin` page. Audience UI polls every 2s and auto-loads new parts when available. Server returns 403 for parts beyond `currentPart`.

2. **~150 word target, 175 hard cap** — Story parts must be short for 60-second phone reading. Physical-reality-first instruction: lead with what is physically happening before getting clever.

3. **Story structure: Parts 2-3 cliffhangers, Part 4 solves both** — Parts 2 and 3 present problems (floating servers, speed-of-light CI/CD) and end on unsolved cliffhangers. Part 4 reveals creative solutions to both problems AND carries the emotional weight of loneliness.

4. **Welcome screen** — Audience sees "Welcome to The Story Generator! Your story will begin soon." until presenter advances to part 1.

5. **Per-user unique stories** — Each audience member gets their own LLM-generated story (not shared). Cached per session so refresh doesn't re-generate.

6. **Multi-variant admin (M5)** — Admin page POSTs to all variant URLs via `VARIANT_URLS` config. Single "Advance" button sends to all variants. Status display shows each variant's current part. Shared-secret auth protects mutations.

7. **Port 8080 default** — Knative injects `$PORT` and defaults to 8080. App reads `PORT` env var; default changed from 3000 to 8080.

8. **K8s readiness requirements in M1** — 5 new items: `GET /healthz` (liveness, simple 200), `GET /readyz` (readiness, 503 during shutdown), SIGTERM graceful shutdown, port 8080 default, Dockerfile hardening (non-root user, tini for PID 1).

9. **OTel API only in app code** — App depends on `@opentelemetry/api` (lightweight no-op). The deployer's platform provides the SDK. Never add SDK, instrumentation packages, or auto-instrumentation to this repo.

10. **Funny style with puns on tech-meets-lunar-reality** — System prompt specifies puns/wordplay on technical terminology meeting lunar reality. One extended metaphor max per part. Moon-specific physics must be explicit (1/6 gravity, no atmosphere, spacesuit, moon dust, speed of light).

## HARD CONSTRAINTS

- **JavaScript only** — not TypeScript
- **Anthropic SDK** for LLM calls
- **OTel API only** — no SDK, no instrumentation packages
- **Whitney's scope only** — Thomas owns the platform (Knative, Flagger, Contour, OTel Collector). This repo = demo apps + audience web UI
- **Same story arc across variants** — both variants in each round tell the same beats in the same order; only style (Round 1) or model quality (Round 2) differs
- **4 container images** — 2 per demo round, admin baked into each
- **Vitest** for tests, not Jest
- **vals** for secrets — never export to `.zshrc` or commit secrets
- **No mock modes** — real data and APIs only
- **No Co-Authored-By AI attribution** in commits

## EXPLICIT DO-NOTs

- Do NOT add a countdown timer or any auto-advance pacing mechanism
- Do NOT use TypeScript
- Do NOT chain LLM outputs between story parts
- Do NOT add OTel SDK or instrumentation packages — API only
- Do NOT use "Houston, we have a problem" in story prompts
- Do NOT create a separate admin service — admin is part of each app
- Do NOT use `npm start` in Dockerfile CMD — use `node` directly
- Do NOT put dependency checks in liveness probes
- Do NOT default port to 3000 — use 8080 for Knative
- Do NOT commit manually during PRD work — `/prd-update-progress` handles commits
- Do NOT add fallback mechanisms without explicit permission
- Do NOT make unrelated code changes — document them in a new issue instead

## CURRENT STATE

**PRD #1 Complete (Whitney's scope)** — All milestones M1-M5 implemented and tested. M6/M7 deferred to Thomas's platform integration.

**Implemented milestones:**
- M1: Core story app with K8s readiness (health endpoints, graceful shutdown, non-root Dockerfile)
- M2: Voting + OTel instrumentation (`gen_ai.evaluation.result` span events)
- M3: Round 1 prompt variants (dry/academic vs funny/engaging moon story)
- M4: Round 2 model variants (Haiku vs Opus circus/Houdini story)
- M5: Multi-variant admin with status display and shared-secret auth
- README with project overview, dev setup, and build instructions

**Deferred (requires Thomas's platform):**
- M6: Integration testing on Knative + Flagger + OTel Collector
- M7: Datadog dashboards for satisfaction metrics