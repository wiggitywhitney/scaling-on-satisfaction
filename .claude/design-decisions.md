# Design Decisions & Anti-Regression Guide
**Generated:** 2026-03-03 08:16
**Project:** /Users/whitney.lee/Documents/Repositories/scaling-on-satisfaction
**Session:** 3e001eaa-e66c-4655-81d7-ded8bb98400a
**Compaction trigger:** manual

Now I have all the context. Here's the document:

---

## CURRENT APPROACH

**PRD #4: Build, Verify, and Push Container Images to Docker Hub**

Build 4 container images using existing build scripts (`scripts/build-round1.sh`, `scripts/build-round2.sh`), verify each with human review, test admin panel in single + paired configurations, push to Docker Hub under `wiggitywhitney/`, and update README for Thomas.

- Build scripts accept a registry prefix argument: `./scripts/build-round1.sh wiggitywhitney/story-app`
- Docker Hub push uses Whitney's existing Docker CLI auth (already configured to push to `wiggitywhitney`)
- Images are tagged `:latest` — 4 images total: `story-app-1a`, `story-app-1b`, `story-app-2a`, `story-app-2b`
- Human verification required for every image before pushing
- Admin panel must be verified in two configurations: single variant, then paired variants

**Workflow**: PRD started → need to commit PRD to main → create feature branch `feature/prd-4-container-image-publish` → work through milestones M1-M5 → PR → merge → close issue #4.

## REJECTED APPROACHES — DO NOT SUGGEST THESE

- **[REJECTED] ghcr.io (GitHub Container Registry)**: User explicitly said "Don't push to ghcr.io - to my dockerhub instead." Docker CLI already pushes to Docker Hub. No reason to add ghcr.io auth.
- **[REJECTED] Automated verification only**: User explicitly requested "I want human verification for each image." Each image has a different style/model combo that needs visual confirmation. Automated tests cover code correctness; human checks the experience.
- **[REJECTED] Batch verification (verify all images at once)**: User wants to see admin panel work "for just one and then for the pair" — sequential verification, not batch.
- **[REJECTED] TypeScript**: Project constraint is JavaScript only. Not TypeScript.
- **[REJECTED] Running tests locally during completion workflow**: Tests run in CI pipeline. PRD skill explicitly states "Do not run tests locally during the completion workflow."

## KEY DESIGN DECISIONS

1. **Docker Hub registry target** — `wiggitywhitney/story-app-{1a,1b,2a,2b}:latest`. Whitney's Docker CLI is already authenticated to Docker Hub. (PRD Decision Log, 2026-03-03)

2. **Human verification per image** — Each image runs individually with API key injected. Human checks: container starts, healthz returns 200, audience UI loads, admin panel loads, story generation works, vote buttons work. (PRD Decision Log, 2026-03-03)

3. **Admin panel verified in two stages** — First single variant (one image running), then paired variants (two images running with `VARIANT_URLS` coordination).

4. **Build scripts already exist** — `scripts/build-round1.sh` and `scripts/build-round2.sh` accept registry prefix as first argument. No new build tooling needed.

5. **Image matrix is fixed** — 4 specific combinations defined in PRD. Round 1: dry+sonnet-4, funny+sonnet-4. Round 2: funny+haiku-4.5, funny+opus-4.6. Round 2 style defaults to "funny" but will be set to winning style during live demo.

6. **API key via vals** — Images need `ANTHROPIC_API_KEY` at runtime. Injected via `vals exec -f .vals.yaml` or `-e` flag on `docker run`.

7. **PRD committed to main first, then feature branch** — PRD file was created on main. The `/prd-start` workflow commits the PRD docs to main (with `[skip ci]`), then creates the feature branch for implementation work.

8. **Query string admin secret is intentional** — From PRD #1 Decision 27: "Presenter bookmarks `/admin?secret=<value>`." This is a 25-minute conference demo, not production. CodeRabbit flagged it; we deliberately kept it.

## HARD CONSTRAINTS

- **JavaScript only** — no TypeScript. Project-level constraint.
- **OTel API only** — app uses `@opentelemetry/api` as peerDependency. SDK is provided by deployer (Thomas's platform).
- **Anthropic SDK** for LLM calls.
- **vals for secrets** — never export secrets to `.zshrc` or commit to repos. Use `vals exec -f .vals.yaml -- command`.
- **ABOUTME headers required** — all `.js` source files must have ABOUTME header comment. Enforced by PreToolUse hook.
- **No AI attribution in commits** — never include Claude/Anthropic/Co-Authored-By references.
- **Feature branches required** — never commit directly to main (except docs-only with `[skip ci]`). `.skip-branching` not present.
- **CodeRabbit review required before merge** — `.skip-coderabbit` not present.
- **Pre-push hook runs security checks** — `console.log` statements in source files need `// eslint-disable-next-line no-console` annotations or they block push.
- **Do NOT commit manually during PRD work** — `/prd-update-progress` handles commits, PRD updates, and journaling together.

## EXPLICIT DO-NOTs

- **Do NOT push to ghcr.io** — Docker Hub only (`wiggitywhitney/`)
- **Do NOT skip human verification** — every image must be reviewed by the user
- **Do NOT run tests during completion workflow** — CI handles that
- **Do NOT use TypeScript** — JavaScript only
- **Do NOT add OTel SDK dependencies** — API only
- **Do NOT commit with AI attribution** — no Co-Authored-By, no Claude/Anthropic references
- **Do NOT commit manually during PRD work** — use `/prd-update-progress`
- **Do NOT amend previous commits** — always create new commits
- **Do NOT suggest ghcr.io as alternative** — user explicitly rejected it
- **Do NOT batch image verification** — one at a time, then paired

## CURRENT STATE

**What has been done:**
- PRD #1 (demo apps) is complete and merged (PR #3, Issue #1 closed)
- All 4 demo app variants are implemented with 125 tests passing
- Build scripts exist (`scripts/build-round1.sh`, `scripts/build-round2.sh`)
- Dockerfile exists with `VARIANT_STYLE`, `VARIANT_MODEL`, `ROUND` build args
- PRD #4 file created at `prds/4-container-image-publish.md`
- Issue #4 created on GitHub with PRD label
- 6 Anki cards saved for project knowledge

**What remains (PRD #4 milestones):**
- **M1**: Build all 4 images (run build scripts with `wiggitywhitney/story-app` prefix)
- **M2**: Verify each image individually with human review (4 images, sequential)
- **M3**: Verify admin panel with single variant running
- **M4**: Verify admin panel with paired variants (coordinator + follower via `VARIANT_URLS`)
- **M5**: Push all 4 to Docker Hub + update README with pull/run instructions for Thomas

**Current git state:** On `main`, clean working tree. The PRD #4 file needs to be committed to main (docs-only, `[skip ci]`), then a feature branch `feature/prd-4-container-image-publish` needs to be created. The `/prd-start` workflow was interrupted at the "commit PRD and create branch" step.