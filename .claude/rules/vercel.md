# Vercel Deployment Rules

## How preview deploys work

Vercel's GitHub integration **automatically** creates a preview URL for every PR. It runs as a GitHub Check on the PR. To get the preview URL:

1. Push a branch
2. Open a PR (or find the existing one)
3. Go to the PR's "Checks" tab on GitHub — copy the URL from the Vercel check

**Never** run `vercel` CLI manually to get a preview URL — this creates orphan projects under a different auth context and leaves behind stale deployments.

## Rules

| Action | Rule |
|--------|------|
| Preview URL for a PR | Get it from the PR's GitHub checks — never run `vercel` CLI |
| Production deploy | Only when Bea explicitly says "ship to production" |
| `vercel --prod` | **Forbidden** unless Bea says the exact words "ship to production" |
| `vercel link` | **Forbidden** from worktree directories — run only from the repo root on the main checkout |
| `vercel deploy` | **Forbidden** for previews — GitHub integration handles it automatically |

## `vite.config.ts` — git SHA fallback

Vercel build environments have no git history, so `git rev-parse HEAD` will fail. Always use the Vercel env var with a fallback:

```ts
const gitSha =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  execSync('git rev-parse --short HEAD').toString().trim();
```

Wrap the `execSync` in a try/catch so a missing `.git` directory never breaks the build:

```ts
function getGitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}
```

## Production vs preview environments

| Branch | Auto-deploy target |
|--------|--------------------|
| `main` | https://animalcrossingwebapp.vercel.app (production) |
| `development` | https://development-animalcrossingwebapp.vercel.app |
| Any PR branch | Auto-generated Vercel preview URL (visible in PR checks) |
