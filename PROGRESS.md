# Progress Log

Development progress log for scaling-on-satisfaction. Tracks implementation milestones across PRD work.

## [Unreleased]

### Added
- Synchronized variant loading with readyAt timestamp forwarding
- Timer-gated content display: audience stories generate during sync window but display is held until ready
- Admin panel shows preparing/ready sync state with countdown
- Audience UI "Getting ready..." state during sync window
- Coordinator forwards readyAt timestamp to variants on advance
- Variant failure/timeout handling during synchronized advance
- Acceptance gate tests calling real Anthropic API (story generation verification)
- Playwright E2E tests for synchronized variant loading (10 tests)
- vals exec wrapper script for acceptance test PATH handling
- Warmup endpoint pre-generates Part 1 on page load
- Eager pre-generation of Part N+1 after serving Part N
- Staggered pre-generation delay (PREGEN_DELAY_MS) to avoid API key rate-limit competition
- Pre-generation retry with error logging on failure (PREGEN_RETRY_DELAY_MS)
- Douglas Adams style for funny variant (both rounds)
- Deadpan narrator style for dry variant (both rounds)
- Shared story serving: all audience members see the same story per variant
- Admin pre-generate endpoint (POST /api/admin/pre-generate) generates all 5 parts before demo
- In-flight deduplication for on-demand generation (concurrent requests share one LLM call)
- Admin status includes sharedStoryParts array showing pre-generated parts

### Changed
- Removed SYNC_DELAY_MS config (replaced by warmup + pre-generation pipeline)
- Simplified advance route to use readyAt query param only
- Story endpoint now checks shared store before on-demand generation
- Warmup stores results in shared store instead of per-session
- createAdminRouter accepts generator parameter for pre-generation
