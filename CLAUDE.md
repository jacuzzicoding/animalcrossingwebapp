# CLAUDE.md

Guidance for Claude Code sessions in this repository.

## IMPORTANT: Vite/React Only — NOT Expo

The app lives entirely in `src/`. It is a **Vite + React 19 + TypeScript + Tailwind v4 + Zustand** web app.
A previous Claude session mistakenly built a parallel Expo/React Native app — that code was deleted.
**Never create Expo, React Native, or `app/` directory structures.** Always verify `vercel.json` before starting feature work.

## Dev Process

See `docs/dev-process.md` — every PR must follow the checklist there.  
See `docs/architecture.md` — deep architectural context (store schema, migrations, multi-game types).

## Project Overview

Animal Crossing multi-game companion web app. Tracks museum donations (fish, bugs, fossils, art) across multiple towns and games.
Cozy parchment/GameCube museum aesthetic. **Current version: v0.7.0-alpha**
Live at: https://animalcrossingwebapp.vercel.app | Dev preview: https://development-animalcrossingwebapp.vercel.app

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
**Styling:** Tailwind CSS v4 (utility classes only; design tokens via `src/lib/colors.ts` — inline hex)  
**State:** Zustand ^5 with `persist` middleware (localStorage key: `ac-web`, schema v2)  
**Tests:** Vitest  
**Store schema:** 3-level `donated[townId][gameId][itemId]` (as of v0.7)  
**Migration:** Zustand persist v2 + `bootstrapMigration.ts` — zero data loss for existing users

### File Structure

```
src/
  App.tsx                   # Root component — hydration guard + ErrorBoundary + ACCanvas
  main.tsx                  # Entry point — runs bootstrapMigration before React mounts
  components/
    ACCanvas.tsx            # Orchestration shell ~298 lines. Mounts active tab view,
                            # wires modals and global search. Decomposition complete (v0.7).
    HomeTab.tsx             # Home screen: seasonal availability, leaving-soon,
                            # progress cards, recent activity
    CollectibleRow.tsx      # Single item row with donate toggle
    MuseumHeader.tsx        # Header bar + TownSwitcher dropdown
    TabBar.tsx              # Tab navigation strip
    TownSwitcher.tsx        # Town dropdown with game badge per town
    ErrorBanner.tsx         # Dismissible inline error notification
    ErrorBoundary.tsx       # Top-level React error boundary; crashes render ErrorState
    ErrorState.tsx          # Full-page error fallback UI
    shared/
      CategoryProgress.tsx  # "X / Y donated" progress bar
      DonateToggle.tsx      # Checkbox/button to mark item donated
      EmptyState.tsx        # "Nothing here yet" placeholder
      HabitatChip.tsx       # Fish habitat badge
      MonthGrid.tsx         # 12-cell month availability grid
      SearchBar.tsx         # Per-tab inline search input
    modals/
      CreateTownModal.tsx   # New town form with game selector
      EditTownModal.tsx     # Rename town form (gameId immutable)
      DetailModal.tsx       # Item detail sheet
    views/
      AnalyticsView.tsx     # Charts + stats tab content
      ActivityFeed.tsx      # Recent donations list
      SectionCard.tsx       # Reusable card wrapper
    search/
      GlobalSearchBar.tsx   # Global search input
      GlobalSearchResults.tsx  # Cross-category search results
      SearchHistoryPopover.tsx # Recent search history dropdown
  hooks/
    useHydration.ts         # Gates render on Zustand persist rehydration (onFinishHydration)
    useMuseumData.ts        # Fetches and caches all 4 category JSONs for active town's game
    useSearch.ts            # Search history, click-outside, debounce
    useCategoryStats.ts     # Memoized donated counts per category
  lib/
    store.ts                # Zustand store: towns, donations, activeTownId. persist key 'ac-web' v2.
    bootstrapMigration.ts   # One-time localStorage rename (ac-web:v1 → ac-web), called in main.tsx
    storeMigrations.ts      # Zustand migrate callback: v1→v2 schema lift
    categoryMeta.ts         # CATEGORY_META constant (label/Icon/file per category)
    viewTypes.ts            # ViewId and AllData types
    constants.ts            # MONTH_NAMES, CATEGORY_LABELS, CATEGORY_ORDER, SEASONS
    colors.ts               # Design token hex constants
    types.ts                # Shared TypeScript interfaces (Town, Donation, GameId, Game, etc.)
    utils.ts                # Helper functions (formatting, date math, type guards)
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
public/data/acww/
  fish.json                 # 56 species (Wild World)
  bugs.json                 # 56 species (Wild World)
  fossils.json              # 52 fossil items (Wild World)
public/data/accf/
  fish.json                 # 40 species (City Folk)
  bugs.json                 # 40 species (City Folk)
  fossils.json              # 52 fossil items (City Folk)
docs/
  dev-process.md            # PR checklist and dev process rules for Claude Code sessions
  architecture.md           # Deep architectural context: store schema, migrations, multi-game types
  v0.7-audit.md             # Codebase audit: component modularity, type safety, latent bugs
  v0.7-architecture-proposal.md  # Multi-game foundation design: store schema, decomposition plan
```

### Design System

Inline hex constants via `src/lib/colors.ts` — **no Tailwind design tokens**:
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
- `development` branch auto-deploys to https://development-animalcrossingwebapp.vercel.app
- Manual: `vercel --prod` from repo root
- `vercel.json`: `buildCommand: npm run build`, `outputDirectory: dist`, `installCommand: npm install`
- Project: `animalcrossingwebapp` under `jacuzzicodings-projects`

## Known Issues

- **issue #10** — CI was broken (ran `npx expo export` instead of `npm run build`) — **fixed**
- **issue #1** — Seasonal analytics counted everything as spring — **fixed in v0.7**
- **@vercel/analytics missing** — package was missing from dependencies — **fixed in v0.7**
- **ACCanvas.tsx decomposition** — completed in v0.7 (PRs #25); file is now ~298-line orchestration shell
- **useMuseumData hardcoded to ACGCN paths** — **fixed in v0.7.0-alpha** (PR #27); now accepts `gameId` and fetches from the correct `/data/<game>/` directory

## ACCanvas.tsx

`src/components/ACCanvas.tsx` was decomposed in v0.7 and is now ~298 lines (orchestration shell only).
It mounts the active tab view, wires modals, and handles global search. All data fetching,
filtering, and sub-component logic lives in dedicated hooks and components.
Do not add new top-level tabs without updating the tab switch and `TabBar` props.

## Roadmap

### Shipped
- v0.1–v0.2: Initial release, basic museum tracking, town management
- v0.3: Town management improvements
- v0.4: Global search, analytics/stats tab
- v0.5: CSV export, error handling UI, Vitest tests, Vercel Analytics, monthly availability chart, enriched JSON data
- v0.6: Home screen (available this month, leaving-soon, progress cards, recent activity)
- v0.6.1: Hotfix — restore files deleted by bad v0.6.0 merge, fix corrupted main branch
- v0.7.0-alpha — **shipped 2026-04-17**:
  - Edit/rename town, documentation overhaul (CLAUDE.md, README, CHANGELOG, CI fix)
  - Seasonal analytics fix (#1), edit modal visual polish, @vercel/analytics fix
  - v0.7 architecture proposal and codebase audit
  - Wild World + City Folk data in `public/data/acww/` and `public/data/accf/`
  - Type safety pass: AppErrorKind, type guards, ErrorBoundary, pre-commit hooks
  - 3-level donation schema (townId→gameId→itemId), Zustand v2 migration, hydration guard
  - Game selection UI (PR #23), ACCanvas decomposition (PR #25)
  - Game-aware data loading in `useMuseumData` (PR #27)

### v0.7 — Multi-game foundation (remaining)
- Add React Router for game URLs and item detail routes

### v0.8 — Full game coverage + item details
- Add New Leaf and New Horizons item data
- Item detail views (inline expand for fish/bugs/fossils, bottom sheet for art)
- Seasonal/time-based filtering

### v0.9 — Polish, onboarding, and PWA
- UI redesign pass; PWA support; mobile-first responsive pass; first-run onboarding

### v1.0 — Launch ready
- Branding, SEO, accessibility, performance audit

## Sister Project

Swift/Xcode version at `../AnimalCrossingGCN-Tracker` — reference for data models and original design intent.
