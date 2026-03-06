# PRD #9: Story Export / See Your Full Story

**GitHub Issue**: [#9](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/9)
**Status**: Backlog
**Priority**: Low
**Depends On**: PRD #1 (complete), PRD #6 (in progress)

## Problem

After reading all 5 parts of their personalized AI-generated story, audience members have no way to see the complete story in one view. Each part is shown individually during the demo, and the story disappears when the session ends. Audience members who enjoyed their unique story can't revisit it or share it.

## Solution

Give audience members a way to view their complete personalized story after finishing all 5 parts. The exact implementation approach should be determined at build time based on what's simplest and most effective. Possibilities include a "See Your Full Story" link after Part 5, a dedicated page, or a shareable URL.

### Key Constraint

Knative traffic splitting may route different story part requests through different app instances (e.g., Part 1 from instance A, Part 2 from instance B). The solution must account for the fact that all 5 parts of a user's story are stored in-memory on whichever instance served each request. Implementation should determine the best approach to handle this — options range from client-side aggregation to shared storage to accepting the constraint.

## Milestones

### M1: Full Story View
After all 5 parts are read, the audience member can see their complete story in a single view.

- [ ] Complete story viewable in one page after finishing all parts
- [ ] Story displays all 5 parts in order with clear part separators
- [ ] Works correctly when all parts are served by the same instance

### M2: Cross-Instance Support
Handle the case where Knative routes different parts through different instances.

- [ ] Determine approach for cross-instance story assembly (implementation decides)
- [ ] Full story view works correctly under traffic splitting

### M3: Tests & Polish
- [ ] Tests cover the full story view feature
- [ ] UX feels natural — no awkward flows or dead ends

## Success Criteria

- [ ] Audience members can view their complete 5-part story after finishing
- [ ] Works under Knative traffic splitting (both variants, both rounds)
- [ ] No disruption to existing demo flow

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-06 | Implementation approach TBD at build time | Multiple valid approaches; best to decide with code in hand |
| 2026-03-06 | Priority: Low | Nice-to-have UX enhancement, not blocking the KubeCon demo |
| 2026-03-06 | Cross-instance is the hard problem | Knative traffic splitting means parts may live on different instances |

## Future Considerations

- **Shareable URLs**: Could generate a permalink for each story so audience members can share
- **Story gallery**: Could collect all audience stories for a post-talk display
- **Export formats**: PDF, image, or social-media-friendly card
