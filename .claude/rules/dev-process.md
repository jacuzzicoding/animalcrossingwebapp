# Dev Process Rules (v0.7+)

Every feature, fix, or change must follow this checklist before the PR is complete:

1. Feature branch with clean, descriptive commits
2. PR with proper description targeting `development` branch
3. CHANGELOG.md updated with entry under the current version section
4. CLAUDE.md updated if any of these changed: file structure, new components/hooks/utils, architecture, commands, known issues, version number
5. Tests pass — run `npm run build` and `npm test` before pushing
6. Dev preview tested at https://development-animalcrossingwebapp.vercel.app/ for any user-visible changes
7. Version references kept current (CLAUDE.md, README.md)

## Documentation Standards
- CLAUDE.md is the primary context file for new sessions. If it's wrong, every future session starts with bad info.
- CHANGELOG.md follows Keep a Changelog format
- When in doubt whether to update docs: UPDATE THEM. Stale docs are worse than no docs.

## Git Workflow
- Branch from `development`, PR back to `development`
- `main` is production — only merge `development` → `main` for releases
- Use merge commits (not squash) to preserve history
- ACCanvas.tsx is a frequent conflict point — coordinate with Dispatch before touching it
