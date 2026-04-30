# Dev Process Rules (v0.8+)

Every feature, fix, or change must follow this checklist before the PR is complete:

1. Feature branch with clean, descriptive commits
2. PR with proper description targeting `development` branch
3. CHANGELOG.md updated with entry under the current version section
4. CLAUDE.md updated if any of these changed: file structure, new components/hooks/utils, architecture, commands, known issues, version number
5. Tests pass — run `npm run build` and `npm test` before pushing
6. Dev preview tested at https://development-animalcrossingwebapp.vercel.app for any user-visible changes
7. Version references kept current (CLAUDE.md, README.md)

## PR Description Requirements

Every PR description must include:

### Summary
What changed and why — not just a file list. If you made a non-obvious design decision (e.g. chose cards over a dropdown, defaulted to X instead of Y, skipped a feature from the spec), explain the reasoning here. Future sessions and developers need to understand why, not just what.

### Decisions (if applicable)
Any tradeoffs made, alternatives rejected, or deviations from the architecture doc. Examples:
- "Used card selector instead of dropdown because the game list is short and visual identity matters"
- "Skipped art tab for ACCF because no art data exists yet — tracked in issue #X"
- "Chose to gate on hydration before render rather than showing a spinner because..."

If there were no non-obvious decisions, this section can be omitted.

### Test plan
What was verified before submitting (build, tests, manual checks).

## Documentation Standards
- CLAUDE.md is the primary context file for new sessions. If it's wrong, every future session starts with bad info.
- CHANGELOG.md follows Keep a Changelog format
- When in doubt whether to update docs: UPDATE THEM. Stale docs are worse than no docs.
- The goal: a fresh Claude Code session should be able to pick up where the last one left off using only committed docs + code. If that's not possible, the docs are incomplete.

## Git Workflow
- Branch from `development`, PR back to `development`
- `main` is production — only merge `development` → `main` for releases
- Use merge commits (not squash) to preserve history
- Commit messages should state intent, not just action ("fix: prevent donation state leaking across towns" not "fix: update store.ts")

## Filing & Closing Bugs

Every bug fix MUST have a GitHub Issue. The flow is:

1. **Discover a bug** (Bea reports it, regression caught in dev, etc.)
2. **File an issue immediately** with `gh issue create` BEFORE starting the fix:
   - Title: descriptive ("X happens when Y" not "fix X")
   - Body: reproduction steps, severity, root cause if known
   - Labels: `bug`, plus `regression` if introduced by a recent change, plus version label (`v0.8`, `v0.9`) if deferred to a later release
3. **Reference the issue from the fix PR** using `Closes #N` (or `Fixes #N` / `Resolves #N`) in the PR body. This auto-closes the issue when the PR merges.
4. **Verify auto-close** after merge — if the issue is still open, close manually with `gh issue close N --comment "Fixed by PR #M."`

For bugs where the architectural fix is deferred (e.g. v0.8.1 grey-out instead of the proper v0.9 lift), keep the issue open with a label for the target release and a comment explaining what was shipped vs what's still pending.

For retro filing — bugs we fixed in past PRs without ever creating an issue — file a brief issue (title + symptom + fix PR reference) and immediately close. Searchable history is the goal.
