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
