# CLAUDE.md

Guidance for Claude Code sessions in this repository.

## IMPORTANT: Vite/React Only — NOT Expo

The app lives entirely in `src/`. It is a **Vite + React 19 + TypeScript + Tailwind v4 + Zustand** web app.
A previous Claude session mistakenly built a parallel Expo/React Native app — that code was deleted.
**Never create Expo, React Native, or `app/` directory structures.** Always verify `vercel.json` before starting feature work.

## Project Overview

Animal Crossing GCN companion web app. Tracks museum donations (fish, bugs, fossils, art) across multiple towns.
Cozy parchment/GameCube museum aesthetic. **Current version: v0.6.1**
Live at: https://animalcrossingwebapp.vercel.app

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # tsc && vite build → dist/
npm run test      # Vitest unit tests
npm run lint      # ESLint
npm run format    # Prettier (if configured)
npm install       # Install dependencies
```

## Architecture

**Framework:** Vite + React 19 + TypeScript  
**Styling:** Tailwind CSS v4 (utility classes only; design tokens are inline hex — see below)  
**State:** Zustand ^5 with `persist` middleware (localStorage)  
**Tests:** Vitest

### File Structure

```
src/
  App.tsx                   # Root component, mounts ACCanvas
  main.tsx                  # Entry point
  components/
    ACCanvas.tsx            # PRIMARY COMPONENT — ~1500 lines. Tab navigation,
                            # all four museum tabs (Fish/Bugs/Fossils/Art),
                            # town switcher, search, modal. CONFLICT-PRONE.
    HomeTab.tsx             # Home screen: seasonal availability, leaving-soon,
                            # progress cards, recent activity
    ErrorBanner.tsx         # Dismissible inline error notification
    ErrorState.tsx          # Full-page error fallback UI
  lib/
    store.ts                # Zustand store: towns, donations, activeTownId
    types.ts                # Shared TypeScript interfaces (Town, Donation, etc.)
    utils.ts                # Helper functions (formatting, date math, etc.)
    csvExport.ts            # CSV export logic for donation data
    store.test.ts           # Vitest tests for store actions
    utils.test.ts           # Vitest tests for utility functions
  test/
    setup.ts                # Vitest setup file
public/data/acgcn/
  fish.json                 # 40 species with months[] availability data
  bugs.json                 # 40 species with months[] availability data
  fossils.json              # 25 fossil items
  art.json                  # 13 paintings
```

### Design System

Inline hex styles — **no Tailwind design tokens**. Use raw hex values:
- `#7B5E3B` — wood (header/section backgrounds)
- `#F5E9D4` — paper (card backgrounds)
- `#2A2A2A` — ink (primary text)
- `#3CA370` — leaf (progress bars, success states)
- `#E7DAC4` — border colour
- `#5a4a35` — secondary/muted text
- Google Fonts: **Varela Round**

## Git Workflow

- `main` — stable tagged releases only. **Never commit directly to main.**
- `development` — active integration branch. All PRs target `development`.
- Feature branches: `feature/<name>` off `development`, merged via PR.
- Hotfix branches: `fix/<name>` off `main` when needed, PR back to main + development.
- Tag releases: `git tag v0.X.Y && git push origin v0.X.Y`

## Deployment

- **Vercel** auto-deploys from `main` to https://animalcrossingwebapp.vercel.app
- Manual: `vercel --prod` from repo root
- `vercel.json`: `buildCommand: npm run build`, `outputDirectory: dist`, `installCommand: npm install`
- Project: `animalcrossingwebapp` under `jacuzzicodings-projects`

## Known Issues

- **issue #1** — Seasonal analytics bug (Stats tab)
- **issue #10** — CI was broken (ran `npx expo export` instead of `npm run build`) — now fixed
- **Home screen tab routing** — HomeTab may not display correctly depending on active tab state; treat as fragile

## ACCanvas.tsx Warning

`src/components/ACCanvas.tsx` is ~1500 lines and contains all tab navigation logic.
It is **highly conflict-prone** in multi-session work. Before editing:
1. Read the whole file (or at minimum the tab-routing section).
2. Make surgical edits — avoid reformatting unrelated code.
3. Do not add new top-level tabs without updating every switch/conditional that handles tab state.

## Roadmap

### Shipped
- v0.1–v0.2: Initial release, basic museum tracking, town management
- v0.3: Town management improvements  
- v0.4: Global search, analytics/stats tab
- v0.5: CSV export, error handling UI, Vitest tests, Vercel Analytics, monthly availability chart, enriched JSON data
- v0.6: Home screen (available this month, leaving-soon, progress cards, recent activity)
- v0.6.1: Hotfix — restore files deleted by bad v0.6.0 merge, fix corrupted main branch
- v0.7.0-alpha: Edit/rename town, documentation overhaul (CLAUDE.md, README, CHANGELOG, CI fix)

### v0.7 — Multi-game foundation
- Fix open bugs: seasonal analytics counting everything as spring (#1), edit modal visual polish
- Build unified multi-game data model (items shared across games with per-game availability metadata)
- Game selection UI
- Migrate existing GCN data to new structure (zero data loss for current users)
- Add Wild World + City Folk item data
- Break up ACCanvas.tsx (~1500 lines) into focused components
- Add React Router for game URLs and item detail routes

### v0.8 — Full game coverage + item details
- Add New Leaf and New Horizons item data
- Item detail views (inline expand for fish/bugs/fossils, bottom sheet for art)
- Seasonal/time-based filtering
- Data access layer (lib/data/) to isolate components from data format

### v0.9 — Polish, onboarding, and PWA
- UI redesign pass (design tokens, consistent styling, cozy museum aesthetic)
- First-run onboarding experience (zero steps to value — land on "Available Now")
- PWA support (service worker, manifest, offline capability, add-to-home-screen)
- Mobile-first responsive pass

### v1.0 — Launch ready
- Branding: favicon, about page, footer with Ko-fi link (jacuzzicoding)
- SEO: meta tags, Open Graph for social sharing, semantic HTML
- Performance audit (bundle size, lazy loading, slow connection testing)
- Accessibility pass (keyboard nav, screen reader, color contrast)
- Final bug sweep and edge case cleanup

### Post v1.0
- Villager tracking
- ACNH-specific features (sea creatures, Nook Miles)
- Shareable completion milestones
- Multi-game dashboard view
- Account sync (optional)

## Sister Project

Swift/Xcode version at `../AnimalCrossingGCN-Tracker` — reference for data models and original design intent.
