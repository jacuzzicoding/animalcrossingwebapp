# Dev Process Rules (v0.7+)

Every feature, fix, or change must follow this checklist before the PR is considered complete.

## PR Checklist

1. **Feature branch** with clean, descriptive commits — branch from `development`, PR back to `development`
2. **PR description** — summary, what changed, and a test plan
3. **CHANGELOG.md** — add entry under the current version section using Added/Changed/Fixed/Removed categories
4. **CLAUDE.md** — update if any of these changed: file structure, new components/hooks/utils, architecture, commands, known issues, version number
5. **Tests pass** — run `npm run build` and `npm test` before pushing
6. **Dev preview tested** at https://development-animalcrossingwebapp.vercel.app/ for any user-visible changes
7. **Version references** kept current across CLAUDE.md, README.md version badge

## Documentation Standards

- **CLAUDE.md is the primary context file for new Claude Code sessions.** If it's wrong, every future session starts with bad info. Keep it accurate.
- **CHANGELOG.md** follows Keep a Changelog format (https://keepachangelog.com)
- When in doubt about whether to update docs: **UPDATE THEM.** Stale docs are worse than no docs.
- After completing work, consider what context future sessions will need. If you created new files, changed architecture, or fixed bugs — update CLAUDE.md.

## Git Workflow

- Branch from `development`, PR back to `development`
- `main` is production — only merge `development` → `main` for tagged releases
- Use merge commits (not squash) to preserve history
- Tag releases: `git tag v0.X.Y && git push origin v0.X.Y`
- `main` — stable tagged releases only. **Never commit directly to main.**

## Memory

- After completing work, consider what context future sessions will need
- If you created new files, changed architecture, or fixed bugs — update CLAUDE.md
- If there's a non-obvious architectural decision, add a comment in the code AND a note in CLAUDE.md
