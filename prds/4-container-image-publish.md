# PRD #4: Build, Verify, and Push Container Images to Docker Hub

**GitHub Issue**: [#4](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/4)
**Status**: Not Started
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
- [ ] Container starts without errors (logs show port, round, style, model)
- [ ] `GET /healthz` returns 200
- [ ] Audience UI loads at `http://localhost:<port>` (welcome screen visible)
- [ ] Admin panel loads at `http://localhost:<port>/admin`
- [ ] Advancing from admin triggers story generation (requires API key)
- [ ] Story text appears in audience UI with correct style/theme
- [ ] Vote buttons work (thumbs up/down)

## Milestones

### M1: Build All 4 Images
Build using existing scripts with Docker Hub registry prefix.

- [ ] Build Round 1 images: `./scripts/build-round1.sh wiggitywhitney/story-app`
- [ ] Build Round 2 images: `./scripts/build-round2.sh wiggitywhitney/story-app`
- [ ] All 4 images appear in `docker images`

### M2: Verify Each Image Individually
Run each image one at a time with API key injected. Human checks story generation, UI, and voting.

- [ ] App 1a (dry/academic moon story) — human verified
- [ ] App 1b (funny/engaging moon story) — human verified
- [ ] App 2a (cheap model circus story) — human verified
- [ ] App 2b (expensive model circus story) — human verified

### M3: Verify Admin Panel — Single Variant
Test the admin panel controls (advance, reset, status display) with one image running.

- [ ] Admin advance moves story forward
- [ ] Admin reset clears state
- [ ] Session count displays correctly
- [ ] Admin auth works when ADMIN_SECRET is set

### M4: Verify Admin Panel — Paired Variants
Run a Round 1 pair (1a + 1b) simultaneously. One variant acts as coordinator with `VARIANT_URLS` pointing to the other.

- [ ] Both variants start on different ports
- [ ] Coordinator admin shows variant status
- [ ] Single "Advance" button advances both variants
- [ ] Reset clears both variants
- [ ] Variant labels display correctly

### M5: Push to Docker Hub and Update README
Push all 4 verified images and add pull instructions to README.

- [ ] `docker push` all 4 images
- [ ] README updated with image names, pull commands, and run instructions for Thomas
- [ ] Thomas can `docker pull` and run any image

## Success Criteria

- [ ] All 4 images build, run, and generate stories correctly
- [ ] Admin panel works for both single and paired variants
- [ ] Images are pullable from Docker Hub
- [ ] README documents how Thomas should pull and deploy the images

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-03 | Docker Hub over ghcr.io | Whitney's Docker CLI already pushes to Docker Hub (`wiggitywhitney`). No reason to add ghcr.io auth. |
| 2026-03-03 | Human verification required per image | Each image has a different style/model combo that needs visual confirmation. Automated tests cover code correctness; human checks the experience. |
