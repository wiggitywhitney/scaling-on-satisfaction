# PRD #7: Set Up Claude Workflow in Thomas's GitOps Repo

**GitHub Issue**: [#7](https://github.com/wiggitywhitney/scaling-on-satisfaction/issues/7)
**Status**: Active
**Priority**: High
**Depends On**: None (Thomas already granted repo access)

## Problem

Thomas gave Whitney access to [kubecon-2026-gitops](https://github.com/ThomasVitale/kubecon-2026-gitops), but it has none of Whitney's Claude Code workflow tooling — no commit-story, no project CLAUDE.md, no vals secrets, no CodeRabbit, no PRD skills. Whitney needs her full development environment without any of it being visible to Thomas in git.

## Solution

Set up the complete Claude workflow in Thomas's repo using `.git/info/exclude` (the per-repo gitignore that is never committed) to keep all tooling invisible. Thomas sees zero evidence of any of this in git status, diffs, PRs, or history.

## Invisibility Mechanism

**`.git/info/exclude`** is a per-repo ignore file that works exactly like `.gitignore` but is never tracked by git. It lives inside `.git/`, which is inherently local. Thomas will never see it.

Everything below gets added to `.git/info/exclude`:
```text
.claude/
.mcp.json
.vals.yaml
journal/
```

## Milestones

### M1: Git Exclude Setup
Configure `.git/info/exclude` in Thomas's repo to hide all Whitney workflow files.

- [x] Add `.claude/`, `.mcp.json`, `.vals.yaml`, `journal/` to `.git/info/exclude`
- [x] Verify `git status` shows nothing after adding these directories/files

### M2: Project CLAUDE.md
Create a project-level `.claude/CLAUDE.md` with context about Thomas's repo — what it is, the FluxCD GitOps structure, Knative/Flagger/OTel Operator setup, and Whitney's role.

- [x] Create `.claude/CLAUDE.md` with repo context and conventions
- [x] Include notes on FluxCD reconciliation, Kustomize overlay pattern, and infrastructure layout
- [x] Document that Whitney's scope includes app manifests and ESO setup

### M3: Commit-Story MCP Server
Set up the commit-story-v2 MCP server so journal entries are captured for work in Thomas's repo.

- [ ] Create `.mcp.json` with commit-story server pointing to local commit-story-v2 install
- [ ] Create `.claude/settings.local.json` with `enabledMcpjsonServers` and `enableAllProjectMcpServers`
- [ ] Create empty `journal/` directory
- [ ] Verify MCP tools are available in Claude Code session

### M4: Commit-Story Git Hook
Install the post-commit hook so journal entries are generated automatically after each commit.

- [ ] Install post-commit hook to `.git/hooks/post-commit`
- [ ] Hook runs commit-story in background with vals for secrets
- [ ] Verify hook fires on a test commit and generates a journal entry
- [ ] Hook is invisible to Thomas (lives in `.git/hooks/`, which is always local)

### M5: Vals Secrets
Set up `.vals.yaml` if any commands in Thomas's repo need secrets injected (e.g., ANTHROPIC_API_KEY for testing, GITHUB_TOKEN for CodeRabbit).

- [ ] Determine which secrets are needed for work in Thomas's repo
- [ ] Create `.vals.yaml` with appropriate `ref+gcpsecrets://` references
- [ ] Verify `vals exec` works for needed commands

### M6: CodeRabbit CLI, PRD Skills & Autonomous Mode
Set up CodeRabbit, autonomous PRD skills, and `/make-autonomous` so Whitney's full workflow is available.

- [ ] Add CodeRabbit MCP server to `.mcp.json` (npx coderabbitai-mcp with GITHUB_TOKEN)
- [ ] Run `/make-autonomous` in Thomas's repo to install YOLO skill symlinks and SessionStart hook
- [ ] Ensure `.claude/skills/` symlinks are covered by `.git/info/exclude` (already under `.claude/`)
- [ ] Ensure `.claude/settings.local.json` permissions and hooks from `/make-autonomous` are invisible (already auto-local)
- [ ] Verify CodeRabbit CLI runs during pre-push hook
- [ ] Verify PRD skills work for creating/tracking work in Thomas's repo
- [ ] Verify `/clear` → auto-resume loop works in Thomas's repo

### M7: Verification
End-to-end verification that everything works and nothing leaks.

- [ ] `git status` is clean — no untracked or modified files from Whitney's tooling
- [ ] `git diff` shows nothing
- [ ] Commit-story journal captures entries on commit
- [ ] Claude Code session has commit-story and CodeRabbit MCP tools available
- [ ] PRD skills functional
- [ ] A test commit and push shows zero evidence of Whitney's tooling

## Success Criteria

- [ ] Full Claude workflow operational in Thomas's repo
- [ ] Zero visibility to Thomas — nothing in git status, diffs, commits, or PRs
- [ ] Commit-story journal captures work locally
- [ ] CodeRabbit CLI reviews code before push
- [ ] Vals injects secrets as needed

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-05 | Use `.git/info/exclude` instead of `.gitignore` | `.gitignore` changes would be visible to Thomas; `.git/info/exclude` is per-repo and never committed |
| 2026-03-05 | All tooling under `.claude/`, `.mcp.json`, `.vals.yaml`, `journal/` | Matches Whitney's standard repo layout; all excluded via single mechanism |
| 2026-03-05 | Post-commit hook is inherently invisible | `.git/hooks/` is always local, never pushed — no exclude entry needed |
| 2026-03-05 | PRD lives in scaling-on-satisfaction, not Thomas's repo | Thomas's repo shouldn't have PRD infrastructure; this tracks Whitney's setup work |
