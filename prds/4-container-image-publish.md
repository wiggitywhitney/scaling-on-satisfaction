# PRD #4: Build, Verify, and Push Container Images to Docker Hub

**GitHub Issue**: [#4](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/4)
**Status**: In Progress
**Priority**: High
**Depends On**: PRD #1 (complete)

## Problem

The 4 demo app container images exist as build scripts but haven't been built, verified, or published. Thomas needs pullable images from a registry to deploy on his Knative platform. Before pushing, each image needs human verification to confirm story generation works, the UI renders correctly, and the admin panel functions for both single-variant and multi-variant scenarios.

## Solution

Build all 4 images, verify each one locally with human review, test the admin panel in single and paired configurations, push to Docker Hub (`wiggitywhitney/`), and update the README with image references for Thomas to pull.

## Image Matrix

| Image | Registry Tag | Round | Style | Model |
|-------|-------------|-------|-------|-------|
| App 1a | `wiggitywhitney/story-app-1a:latest` | 1 | dry | claude-sonnet-4-20250514 |
| App 1b | `wiggitywhitney/story-app-1b:latest` | 1 | funny | claude-sonnet-4-20250514 |
| App 2a | `wiggitywhitney/story-app-2a:latest` | 2 | funny* | claude-haiku-4-5-20251001 |
| App 2b | `wiggitywhitney/story-app-2b:latest` | 2 | funny* | claude-opus-4-6 |

\* Round 2 style defaults to funny; will be set to winning style from Round 1 during the live demo.

## Verification Checklist (Per Image)

For each image, human verifies:
- [x] Container starts without errors (logs show port, round, style, model)
- [x] `GET /healthz` returns 200
- [x] Audience UI loads at `http://localhost:<port>` (welcome screen visible)
- [x] Admin panel loads at `http://localhost:<port>/admin`
- [x] Advancing from admin triggers story generation (requires API key)
- [x] Story text appears in audience UI with correct style/theme
- [x] Vote buttons work (thumbs up/down)

## Milestones

### M1: Build All 4 Images
Build using existing scripts with Docker Hub registry prefix.

- [x] Build Round 1 images: `./scripts/build-round1.sh wiggitywhitney/story-app`
- [x] Build Round 2 images: `./scripts/build-round2.sh wiggitywhitney/story-app`
- [x] All 4 images appear in `docker images`

### M2: Verify Each Image Individually
Run each image one at a time with API key injected. Human checks story generation, UI, and voting.

- [x] App 1a (dry/academic moon story) — human verified
- [x] App 1b (funny/engaging moon story) — human verified
- [x] App 2a (cheap model circus story) — human verified
- [x] App 2b (expensive model circus story) — human verified

### M3: Verify Admin Panel — Single Variant
Test the admin panel controls (advance, reset, status display) with one image running.

- [x] Admin advance moves story forward
- [x] Admin reset clears state
- [x] Session count displays correctly
- [x] Admin auth works when ADMIN_SECRET is set

### M4: Verify Admin Panel — Paired Variants
Run a Round 1 pair (1a + 1b) simultaneously. One variant acts as coordinator with `VARIANT_URLS` pointing to the other.

- [x] Both variants start on different ports
- [x] Coordinator admin shows variant status
- [x] Single "Advance" button advances both variants
- [x] Reset clears both variants
- [x] Variant labels display correctly

### M5: Push to Docker Hub and Update README
Push all 4 verified images and add pull instructions to README.

- [ ] `docker push` all 4 images
- [ ] README updated with image names, pull commands, and run instructions for Thomas
- [ ] Thomas can `docker pull` and run any image

## Success Criteria

- [x] All 4 images build, run, and generate stories correctly
- [x] Admin panel works for both single and paired variants
- [ ] Images are pullable from Docker Hub
- [ ] README documents how Thomas should pull and deploy the images

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-03 | Docker Hub over ghcr.io | Whitney's Docker CLI already pushes to Docker Hub (`wiggitywhitney`). No reason to add ghcr.io auth. |
| 2026-03-03 | Human verification required per image | Each image has a different style/model combo that needs visual confirmation. Automated tests cover code correctness; human checks the experience. |
| 2026-03-03 | Vote locking (no re-votes) | Prevent spam by locking votes after first submission. Returns 409 Conflict on re-vote attempts. |
| 2026-03-03 | 3s generation delay for cheap model (2a) | Haiku responds much faster than Opus. Added MIN_GENERATION_DELAY_MS=3000 to mask speed difference so audience can't identify the cheap model. |
| 2026-03-03 | Strict 150-word max for all stories | Both rounds, both styles enforce a strict 150-word maximum. Previous 130-175 range let the dry style run long. |
| 2026-03-03 | Auto-generated variant labels from style/round | Variant status endpoint derives labels from variant's own style/round response, eliminating need for VARIANT_LABELS env var. |
| 2026-03-03 | Extracted poll controller to prevent session inflation | Audience page's poll loop caused overlapping fetches during slow LLM generation, creating duplicate sessions. Extracted testable poll.js module with fetchingPart guard. |
