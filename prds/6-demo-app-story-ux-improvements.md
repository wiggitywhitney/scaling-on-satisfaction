# PRD #6: Demo App Story & UX Improvements

**GitHub Issue**: [#6](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/6)
**Status**: Active
**Priority**: High
**Depends On**: PRD #1 (complete), PRD #4 (complete)

## Problem

Current demo stories are too long for the live demo pacing, lack a consistent named character, and both variants don't load simultaneously — creating awkward pauses during the KubeCon presentation. The stories need to be tighter (~100 words per part), centered on a memorable character, and both variants need to be ready before the audience sees anything.

## Solution

Shorten story generation to ~100 words per part, introduce a named main character with a defined background (human-approved), and add synchronized variant loading so both versions are generated and ready before presenting to the audience. Update documentation to reflect all changes.

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

### M3: Verification & Image Rebuild
Verify all changes work end-to-end, rebuild container images with the improvements.

- [x] Stories generate at ~100 words per part (both rounds, all variants)
- [x] Character is consistent across all story parts and variants
- [x] Synchronized loading works with paired variants
- [x] Rebuild and push all 4 container images to Docker Hub
- [ ] Human verification of story quality and pacing

### M4: Documentation
Use `/write-docs` to update documentation reflecting all changes.

- [x] Update README with character info and new story length
- [x] Document synchronized loading behavior and configuration
- [x] Update any deployment docs affected by the changes

## Success Criteria

- [x] Stories are ~100 words per part (down from current length)
- [x] A named, human-approved character appears consistently across all variants
- [x] Both variants are ready before audience sees content (no loading lag)
- [x] All 4 container images rebuilt and pushed with improvements
- [x] Documentation reflects current behavior

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

## Future Considerations

- **Backup model provider**: Separate PRD for fallback if Anthropic is down during the live demo
- **Platform integration**: Knative manifests, ESO setup, Datadog/OTel endpoint config live in [kubecon-2026-gitops](https://github.com/ThomasVitale/kubecon-2026-gitops)
