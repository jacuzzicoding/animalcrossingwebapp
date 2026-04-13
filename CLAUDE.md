# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## IMPORTANT: Codebase Is Vite/React — NOT Expo

The real app lives in `src/`. It is a **Vite + React + TypeScript + Tailwind + Zustand** web app.
A previous Claude session mistakenly built a parallel Expo/React Native app that was never deployed — that code has been deleted.
Always verify `vercel.json` build config before starting feature work.

## Project Overview
Animal Crossing GCN companion web app. Tracks museum donations (fish, bugs, fossils, art) across towns with a cozy parchment aesthetic. Current version: v0.2.0-alpha.

## Pre-Approved Commands
- `npm install`
- `git add`, `git commit`, `git push`, `git checkout`, `git branch`, `git log`, `git status`, `git diff`, `git tag`
- `npm run build`
- `npm run dev`
- `node scripts/*.js`

## Development Commands
- `npm run dev` — Start Vite dev server
- `npm install` — Install dependencies
- `npm run build` — Build for production (`tsc && vite build`, outputs `dist/`)

## Architecture

### Framework
- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** for styling
- Standard HTML/JSX (not React Native)

### State Management
- **Zustand ^5** with `persist` middleware (localStorage)
- Store in `src/lib/store.ts`

### Data Files
Located in `public/data/acgcn/`:
- `fish.json` — 40 species
- `bugs.json` — 40 species
- `fossils.json` — 25 items
- `art.json` — 13 paintings

### Cozy Design System
Inline styles mimicking GameCube museum aesthetic (no Tailwind design tokens, just raw hex values inline):
- `#7B5E3B` — wood (header backgrounds)
- `#F5E9D4` — paper (card backgrounds)
- `#2A2A2A` — ink (text)
- `#3CA370` — leaf (progress bars, success)
- `#E7DAC4` — border colour
- `#5a4a35` — secondary text
- Google Fonts: Varela Round

## Git Workflow
- `main` — stable tagged releases only (never commit directly)
- `development` — active feature work; all PRs target this branch
- Feature branches off `development`, merged via PR
- Tag releases: `git tag v0.X.0-alpha && git push origin v0.X.0-alpha`

## Deployment
- **Vercel project**: `animalcrossingwebapp` under `jacuzzicodings-projects`
- **Stable prod URL**: https://animalcrossingwebapp.vercel.app
- Deploy with `vercel --prod` from repo root
- `vercel.json`: `buildCommand: npm run build`, `outputDirectory: dist`, `installCommand: npm install`

## Roadmap (Summary)
- **v0.1.0-alpha** ✅ Basic app, four category tabs, donation tracking
- **v0.2.0-alpha** ✅ Detail modal, search, donation timestamps
- **v0.3.0-alpha** 🚧 Town management: multiple towns, donations keyed by townId, town switcher UI, activity feed
- **v0.4.0-alpha** Global search, analytics
- **v0.5.0-alpha** Export/share, error handling, tests
- **v1.0.0** Full companion app

## Sister Project
Swift/Xcode version at `../AnimalCrossingGCN-Tracker` — reference for data models and original design intent.
