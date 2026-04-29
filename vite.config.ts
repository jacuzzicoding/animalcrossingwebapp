import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));
let gitSha = 'unknown';
let gitBranch = '';
try {
  gitSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // not a git repo (e.g. Vercel build environment)
}
try {
  gitBranch =
    process.env.VERCEL_GIT_COMMIT_REF ??
    execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
} catch {
  gitBranch = '';
}

const versionString =
  gitBranch && gitBranch !== 'main' && gitBranch !== 'development'
    ? `${version} · ${gitBranch}`
    : version;

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(versionString),
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
  },
  plugins: [react()],
});
