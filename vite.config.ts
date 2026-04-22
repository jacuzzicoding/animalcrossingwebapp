import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));
let gitSha = 'unknown';
try {
  gitSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // not a git repo (e.g. Vercel build environment)
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
  },
  plugins: [react()],
});
