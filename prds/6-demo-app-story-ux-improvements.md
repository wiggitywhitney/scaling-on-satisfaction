# PRD #6: Demo App Story & UX Improvements

**GitHub Issue**: [#6](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/6)
**Status**: Active
**Priority**: High
**Depends On**: PRD #1 (complete), PRD #4 (complete)

## Problem

Current demo stories are too long for the live demo pacing, lack a consistent named character, and both variants don't load simultaneously — creating awkward pauses during the KubeCon presentation. The stories need to be tighter (~100 words per part), centered on a memorable character, and both variants need to be ready before the audience sees anything.

Additionally, the app is stateful — each user gets a unique story stored in an in-memory session. With 200-400 audience members hitting a single Anthropic API key, per-user generation will overwhelm rate limits. The app needs to serve one shared story per variant to the whole room and become stateless so Flagger can scale replicas up and down.

## Solution

Shorten story generation to ~100 words per part, introduce a named main character with a defined background (human-approved), and add synchronized variant loading so both versions are generated and ready before presenting to the audience. Switch from per-user unique stories to one shared story per variant, making the app stateless and enabling horizontal scaling. Add story part number to vote telemetry for per-part satisfaction analysis on the Datadog dashboard. Update documentation to reflect all changes.

## Milestones

### M1: Character Design & Story Prompt Improvements
Use `/write-prompt` to craft new story generation prompts. Introduce a named main character with background. Shorten target to ~100 words per part. **Requires human approval on character choice before implementing.**

- [x] Design character concept (name, background, personality) — present options to Whitney for approval
- [x] Use `/write-prompt` to update story generation prompts with character and ~100 word target
- [x] Both round 1 styles (dry vs funny) use the same character
- [x] Both round 2 models use the same character
- [x] Story arc continuity preserved across all variants

### M2: Synchronized Variant Loading
Both variants generate and become ready before the audience sees content. No more one variant showing while the other is still generating.

- [x] Coordinator waits for both variants to complete generation before signaling ready
- [x] Audience UI shows a loading state until both variants are ready
- [x] Admin panel reflects synchronized ready state
- [x] Handles the case where one variant fails or times out

### M3: Shared Story Serving
Replace per-user unique stories with one shared story per variant. All audience members see the same story text for a given variant.

- [ ] Admin endpoint to pre-generate all 5 parts for the current variant (generate once, serve to everyone)
- [ ] Story endpoint serves the shared pre-generated story instead of per-session stories
- [ ] Pre-generation can run before the demo starts (backstage prep)
- [ ] Graceful handling if a part hasn't been pre-generated yet (generate on demand as fallback)

### M4: Make App Stateless
Remove in-memory sessions so the app can scale horizontally. Flagger needs to add/remove replicas.

- [ ] Remove per-user session Map — story text comes from shared pre-generated store
- [ ] Move `responseId` and `spanContext` to client (send with story response, client sends back with vote)
- [ ] Vote double-prevention moves to client-side only (already enforced in browser)
- [ ] Verify app works with multiple replicas (no sticky sessions required)

### M5: Add Story Part to Vote Telemetry
Add the story part number to the `gen_ai.evaluation.result` span event so the Datadog dashboard can show satisfaction broken down by part (e.g., "Part 3 always gets thumbs down because it's the cliffhanger").

- [ ] Pass `partNumber` to `emitEvaluationEvent()` in `src/routes/api.js`
- [ ] Add `story.part` attribute to the span event in `src/telemetry.js`

### M6: Verification & Image Rebuild
Verify all changes work end-to-end, rebuild container images with the improvements.

- [x] Stories generate at ~100 words per part (both rounds, all variants)
- [x] Character is consistent across all story parts and variants
- [x] Synchronized loading works with paired variants
- [ ] Shared story serving works (all users see same story)
- [ ] App is stateless (no per-user sessions)
- [ ] `story.part` attribute appears in OTel span events
- [ ] Rebuild and push all 4 container images to Docker Hub
- [ ] Human verification of Round 1 (moon/space) story quality and pacing
- [ ] Human verification of Round 2 (circus) story quality and pacing

### M7: Documentation
Use `/write-docs` to update documentation reflecting all changes.

- [x] Update README with character info and new story length
- [x] Document synchronized loading behavior and configuration
- [x] Update any deployment docs affected by the changes
- [ ] Update README with `/write-docs` to reflect shared story serving, stateless architecture, story.part telemetry, and rebuilt images

## Success Criteria

- [x] Stories are ~100 words per part (down from current length)
- [x] A named, human-approved character appears consistently across all variants
- [x] Both variants are ready before audience sees content (no loading lag)
- [ ] All audience members see the same story per variant (shared stories)
- [ ] App is stateless — no in-memory sessions, Flagger can scale replicas
- [ ] Vote span events include `story.part` attribute for per-part dashboard analysis
- [ ] All 4 container images rebuilt and pushed with improvements
- [ ] Documentation reflects current behavior

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-05 | ~100 words per part (down from 150) | Thomas feedback: stories too long for demo pacing |
| 2026-03-05 | Named main character with background | Makes stories more engaging and memorable for audience |
| 2026-03-05 | Human approval required for character | Character choice affects the entire demo narrative |
| 2026-03-05 | Use `/write-prompt` for prompt engineering | Skill ensures high-quality, structured prompts |
| 2026-03-05 | Synchronized variant loading | Eliminates awkward pauses where one variant is ready and the other isn't |
| 2026-03-05 | Knative manifests live in Thomas's gitops repo only | Avoid maintaining duplicate manifests; Flux reconciles from Thomas's repo |
| 2026-03-05 | ESO + GSM for Anthropic key management | Whitney already uses GSM via vals; ESO syncs secrets without storing plaintext in git or leaving keys exposed in-cluster |
| 2026-03-05 | Backup model provider is a separate PRD | Different concern (resilience vs. UX); nice-to-have, not blocking |
| 2026-03-06 | Nyx Vasquez for Round 1 (moon) character | Panicky, narrates disasters, always lands on feet — emotive/chaotic personality makes the story more interesting |
| 2026-03-06 | Rae Okonkwo for Round 2 (circus) character | Backend developer, keyboard warrior, fish out of water — contrast with physical circus setting |
| 2026-03-06 | Separate characters per round (not one shared character) | Each story is more self-contained with its own character |
| 2026-03-06 | Improved circus spatial grounding in R2 parts 2-4 | Rae stays in center ring tank, acts happen in adjacent rings — clearer physical layout |
| 2026-03-06 | Timer-gated sync (SYNC_DELAY_MS) instead of shared stories | Keep unique per-session stories; configurable delay gates display so both variants show at roughly the same time |
| 2026-03-06 | Replace SYNC_DELAY_MS with warmup + pre-generation | Warmup pre-generates Part 1 on page load; serving Part N pre-generates Part N+1 in the background. Eliminates loading delays without a fixed sync timer |
| 2026-03-06 | Stagger pre-generation (PREGEN_DELAY_MS, default 2s) | Two instances share one Anthropic API key; simultaneous pre-gen requests cause rate-limit competition. Stagger avoids alternating slow loads |
| 2026-03-06 | Pre-gen retry on failure (PREGEN_RETRY_DELAY_MS, default 5s) | SDK retries 429/529 twice internally; application-level retry adds a second layer. Failed pre-gen is logged and retried once, then falls back to on-demand generation |
| 2026-03-06 | Funny style: Douglas Adams voice | Replaced pun-based humor with Adams-style dry wit, editorial narrator, bemused detachment — better fit for the space/circus absurdity |
| 2026-03-06 | Dry style: deadpan narrator voice | Replaced dense academic jargon with aviation-incident-report / nature-documentary tone — still formal but followable |
| 2026-03-11 | Shared stories instead of per-user unique stories | One Anthropic API key can't support 200-400 concurrent per-user generations. Shared stories also make the demo narrative stronger — everyone reads the same text, so per-part satisfaction discussion is grounded in shared experience |
| 2026-03-11 | Make app stateless | Shared stories eliminate the need for per-session state. Stateless app lets Flagger scale replicas up and down for the canary demo |
| 2026-03-11 | Pre-generate all parts before demo | With shared stories, all 5 parts can be generated once backstage. Eliminates any audience-facing generation latency and API rate limit risk |
| 2026-03-11 | Add story.part to vote span events | Enables per-part satisfaction breakdown on Datadog dashboard — tells the overall story of how votes on each section influenced traffic patterns |
| 2026-03-11 | Fold shared stories + stateless into PRD #6 | Same concern (demo app improvements), avoids awkward sequencing of finishing per-user architecture then immediately replacing it |

## Future Considerations

- **Backup model provider**: Separate PRD for fallback if Anthropic is down during the live demo
- **Platform integration**: Knative manifests, ESO setup, Datadog/OTel endpoint config live in [kubecon-2026-gitops](https://github.com/ThomasVitale/kubecon-2026-gitops)
