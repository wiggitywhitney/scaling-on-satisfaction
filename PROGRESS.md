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
- Vote telemetry includes `story.part` attribute in `gen_ai.evaluation.result` span events for per-part satisfaction analysis

### Changed
- Removed SYNC_DELAY_MS config (replaced by warmup + pre-generation pipeline)
- Simplified advance route to use readyAt query param only
- Story endpoint now checks shared store before on-demand generation
- Warmup stores results in shared store instead of per-session
- createAdminRouter accepts generator parameter for pre-generation
- App is now stateless: removed per-user session Map, cookies, and uuid dependency
- Story response includes responseId and spanContext for client-side vote correlation
- Vote endpoint accepts responseId and spanContext from request body instead of server-side session lookup
- Vote double-prevention moved to client-side only (server no longer tracks votes)
- Admin panel shows pre-generated parts count instead of active sessions
- API route tests rewritten for stateless contract (88 tests, 192 total)
- E2E tests for admin reset (audience returns to welcome), late joiner (sees current part), and vote telemetry (correct request/response payload)
- E2E drift test uses pre-generated content to measure real sync behavior (0ms drift)
- Round 1 and Round 2 walkthrough e2e tests
- Pre-generation e2e test
- Strengthened 100-word prompt limit with rejection language and word count leak prevention
- Existing e2e tests updated for 2-instance shared-story stateless architecture
- (2026-03-11) Pre-generate button in admin panel with disable-while-working UX
- (2026-03-11) Interleaved pre-generation across variants (both variants get part N before part N+1)
- (2026-03-11) E2E test for advance-without-skipping with bidirectional VARIANT_URLS
- (2026-03-11) E2E test for admin pre-generate button
- (2026-03-11) Human verification of Round 1 and Round 2 story quality approved

### Fixed
- (2026-03-11) Advance/reset/pre-generate forwarding loop when both instances have VARIANT_URLS pointing at each other
- (2026-03-11) Advance button double-click race allowing part skips
- (2026-03-11) E2E test runner now sets VARIANT_URLS on both instances to mirror real deployment
- (2026-03-11) Story word counts tightened with end-of-prompt reinforcement
