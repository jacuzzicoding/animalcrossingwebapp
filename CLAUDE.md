# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview
Animal Crossing GCN companion web app built with **Expo + React Native + TypeScript**. Tracks museum donations (fish, bugs, fossils, art) across towns with a cozy parchment aesthetic. Current version: v0.1.0-alpha.

## Pre-Approved Commands
These commands can run without interactive confirmation:
- `NODE_ENV=development npm install --legacy-peer-deps`
- `git add`, `git commit`, `git push`, `git checkout`, `git branch`, `git log`, `git status`, `git diff`, `git tag`
- `npm run build`
- `npx expo export --platform web`
- `cat`, `ls`, `find`, `grep`, `cp`, `mv` (read/copy operations)
- `node scripts/*.js` (data extraction scripts)
- `kill <pid>` for stuck Metro/Expo processes
- `lsof -ti:8081` to check port usage

## Development Commands
- `NODE_ENV=development npm start -- --clear` — Start Expo dev server (Metro)
- `NODE_ENV=development npm install --legacy-peer-deps` — Install dependencies (**always use NODE_ENV=development**)
- `npx expo export --platform web` — Build for web deployment

## Critical Environment Notes
- **Always prefix installs with `NODE_ENV=development`** — if `NODE_ENV=production` is set in the shell, npm silently skips devDependencies (TypeScript, @types/react, etc.)
- If Metro crashes on startup, kill stale processes first: `kill $(lsof -ti:8081)`
- Start server with `--clear` flag to flush the Metro bundle cache

## Architecture

### Framework
- **Expo SDK 54** with expo-router for file-based navigation
- **React Native** components (not web HTML elements)
- **TypeScript** throughout

### State Management
- **Zustand ^4.5.2** (must stay on v4 — v5 uses `import.meta.env` which Metro can't handle)
- Store in `store/` directory with AsyncStorage persistence

### Module Resolution
- **metro.config.js** is critical — sets resolver condition order to `['react-native', 'require', 'default']` to force CJS over ESM. Do not remove or modify this.

### Data Files
Located in `public/data/acgcn/` (or equivalent assets directory):
- `fish.json` — 40 species
- `bugs.json` — 40 species  
- `fossils.json` — 25 items
- `art.json` — 13 paintings

### Cozy Design System
Custom Tailwind/StyleSheet palette mimicking GameCube museum aesthetic:
- `wood`: #7B5E3B (header backgrounds)
- `paper`: #F5E9D4 (card backgrounds)
- `ink`: #2A2A2A (text)
- `leaf`: #3CA370 (progress bars, success)
- `ocean`: #1A2B4A (accent)
- `cube`: #6E5AA3 (accent)
- Google Fonts: Varela Round

## Dependency Notes
Key packages that must stay pinned to specific versions:
- `expo`: ~54.0.0
- `expo-router`: ~6.0.23 (SDK 54 compatible, NOT v55+)
- `expo-font`, `expo-linking`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`: all SDK 54 versions via `npx expo install`
- `react-native-reanimated`: ~3.16.2 (v4 requires separate worklets package)
- `zustand`: ^4.5.2 (NOT v5)

## Git Workflow
- `main` — stable tagged releases only (never commit directly)
- `development` — active feature work; all PRs target this branch
- Feature branches off `development`, merged via PR
- CI runs `npx expo export --platform web` on push to `development` and PRs to `main`
- Tag releases: `git tag v0.X.0-alpha && git push origin v0.X.0-alpha`

## Roadmap (Summary)
- **v0.1.0-alpha** ✅ App boots, Create Town, basic tab navigation
- **v0.2.0-alpha** All four museum categories functional (fish/bugs/fossils/art with donation tracking, progress %, detail views)
- **v0.3.0-alpha** Town management, donation timestamps, activity feed
- **v0.4.0-alpha** Global search, floating category switcher
- **v0.5.0-alpha** Analytics dashboard
- **v0.6.0-alpha** Export/share, error handling, tests
- **v0.7.0-alpha** Villagers, donate tab
- **v1.0.0** Full companion app

## Sister Project
Swift/Xcode version at `../AnimalCrossingGCN-Tracker` — reference for data models, feature parity, and original design intent.
