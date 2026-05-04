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
Cozy parchment/GameCube museum aesthetic. **Last stable: v0.8.2-alpha (shipped 2026-05-01). Active development: v0.9.0-beta — Phase 2 (sidebar shell) shipped; see `docs/v0.9-plan.md` for canonical plan.**
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
**State:** Zustand ^5 with `persist` middleware (localStorage key: `ac-web`, schema v3)  
**Routing:** React Router v6 (`BrowserRouter`); URL structure: `/` → redirect, `/town/:townId` → home tab, `/town/:townId/:tab` → specific tab; `vercel.json` has catch-all SPA rewrite for preview/branch deploys  
**Tests:** Vitest  
**Store schema:** 3-level `donated[townId][gameId][itemId]` (as of v0.7); `Town` includes `hemisphere: 'NH' | 'SH'` (as of v0.8)  
**Migration:** Zustand persist v3 + `bootstrapMigration.ts` — zero data loss for existing users  
**Town CRUD (v0.9 Phase 4):** `TownManager` drawer mounts at the App layout level (above the router), opened via `useUIStore.openTownManager()`. Replaces `CreateTownModal`, `EditTownModal`, and the `TownSwitcher` dropdown. When `towns.length === 0`, App.tsx auto-opens it in `forceCreate` mode (no close/Esc/scrim dismissal). Per Decision 1, edit form has no game `<select>` — game is read-only post-create.  
**Shell layout (v0.9 Phase 2):** `Sidebar` (280px left, sticky) + `<main className="ac-main">` in CSS grid `280px 1fr`, max-width 1440px centered. Below 980px sidebar stacks above main. `MuseumHeader`, `TabBar`, `TownSwitcher` retired — nav lives in the sidebar.

### File Structure

```
src/
  App.tsx                   # Root component — hydration guard + ErrorBoundary + Routes (/, /town/:townId/:tab)
  main.tsx                  # Entry point — runs bootstrapMigration, wraps app in BrowserRouter
  components/
    ACCanvas.tsx            # Orchestration shell ~298 lines. Mounts active tab view,
                            # wires modals and global search. Decomposition complete (v0.7).
    HomeTab.tsx             # v0.9 Phase 6: rebuilt — hero stat + ProgressMeter,
                            # month strip, leaving-soon shelf, just-arrived shelf,
                            # latest donations. Cards fire jumpTo (scroll + pulse).
    ProgressMeter.tsx       # v0.9 Phase 6: segmented progress bar (4 or 5 segments
                            # gated by gameId; sea segment for ACNL/ACNH).
    progressMeterUtils.ts   # Pure helper segmentsForGame (unit-tested).
    CategoryTab.tsx         # v0.9 Phase 7: sectioned category page (Leaving / Available / Out of season / Already donated)
    CollectibleRow.tsx      # Single item row with donate toggle; shows chevron + rounded-top when expanded
    ItemExpandPanel.tsx     # Inline accordion panel shown below CollectibleRow for fish/bugs/fossils
    Sidebar.tsx             # v0.9 Phase 2: 280px left sidebar — brand, active town card, NavLink nav with counts, footer (replaces MuseumHeader/TabBar/TownSwitcher)
    SettingsPage.tsx        # v0.9 Phase 3: full-page Settings — About + Danger zone (no Appearance per locked decision #3)
    SettingsRoute.tsx       # v0.9 Phase 3: route wrapper that mounts Sidebar + SettingsPage at /settings
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
      DetailModal.tsx       # Item detail sheet
    TownManager.tsx         # Right-side drawer for switch/edit/create/delete towns (v0.9 Phase 4)
    views/
      AnalyticsView.tsx     # Charts + stats tab content
      ActivityFeed.tsx      # Recent donations list
      SectionCard.tsx       # Reusable card wrapper
    search/
      GlobalSearchDropdown.tsx # v0.9 Phase 8: unified search dropdown — anchored
                               # under the Home topbar input. Grouped category
                               # results (5 groups for ACNL/ACNH, 4 elsewhere),
                               # keyboard nav (↑↓↵esc), localStorage history
                               # under `ac-curator-search-history` (max 8).
                               # Replaces GlobalSearchBar/Results/HistoryPopover.
  hooks/
    useHydration.ts         # Gates render on Zustand persist rehydration (onFinishHydration)
    useMuseumData.ts        # Fetches and caches all 4 category JSONs for active town's game
    useCategoryStats.ts     # Memoized donated counts per category
    useJumpToRow.ts         # v0.9 Phase 6: navigate to a category tab + set
                            # highlightId so ACCanvas scrolls + pulses the target row
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
public/data/acnh/
  fish.json                 # 81 species (NH/SH months_nh/months_sh)
  bugs.json                 # 80 species (NH/SH months_nh/months_sh)
  fossils.json              # 86 fossil pieces
  art.json                  # 43 paintings (hasFake flag)
  sea_creatures.json        # 40 sea creatures (NH/SH months)
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

See `.claude/rules/vercel.md` for full deployment rules. Key points:

- **Vercel** auto-deploys from `main` to https://animalcrossingwebapp.vercel.app
- `development` branch auto-deploys to https://development-animalcrossingwebapp.vercel.app
- **Preview URLs** come from the PR's GitHub Checks — never run `vercel` CLI manually
- **NEVER** run `vercel --prod` unless Bea explicitly says "ship to production"
- **NEVER** run `vercel link` from a worktree directory
- `vercel.json`: `buildCommand: npm run build`, `outputDirectory: dist`, `installCommand: npm install`
- Project: `animalcrossingwebapp` under `jacuzzicodings-projects`

## Known Issues

- **issue #10** — CI was broken (ran `npx expo export` instead of `npm run build`) — **fixed**
- **issue #1** — Seasonal analytics counted everything as spring — **fixed in v0.7**
- **@vercel/analytics missing** — package was missing from dependencies — **fixed in v0.7**
- **ACCanvas.tsx decomposition** — completed in v0.7 (PRs #25); file is now ~298-line orchestration shell
- **useMuseumData hardcoded to ACGCN paths** — **fixed in v0.7.0-alpha** (PR #27); now accepts `gameId` and fetches from the correct `/data/<game>/` directory
- **Create Town modal centering + iOS zoom** — **fixed in v0.8 (PR #41)**; overlay uses single `flex items-center justify-center`, no `overflow-y-auto`
- **Town switcher showing active town in dropdown** — **fixed in v0.8 (PR #41)**
- **Town switcher dropdown clipped by `overflow-hidden` header** — **fixed in v0.8 (PR #41)**; now uses `position: fixed` anchor
- **issue #26** — Art tab persistent label — **fixed in v0.8.2 (PR #57)**; `setSelected(null)` added to tab-change `useEffect`
- **issue #31** — Create-town edge case; low priority, open
- **Sea creatures tab** — **shipped in v0.8.2 (PR #44, Closes #56)**; Sea tab visible for ACNL and ACNH towns
- **Edit/new-town buttons greyed out on Fish, Bugs, Fossils tabs** — **resolved in v0.9 Phase 4**. The `TownManager` drawer mounts at the App layout level and renders correctly on every route, so the overflow/z-index issues that motivated the stopgap no longer apply.

## ACCanvas.tsx

`src/components/ACCanvas.tsx` was decomposed in v0.7 and is now ~298 lines (orchestration shell only).
It mounts the active tab view, wires modals, and handles global search. All data fetching,
filtering, and sub-component logic lives in dedicated hooks and components.
Do not add new top-level tabs without updating the tab switch in ACCanvas and the nav list in `Sidebar`.

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

- v0.8.0-alpha — **shipped 2026-04-29**:
  - React Router v6 — URL-based navigation, shareable URLs per town/tab (PR #38)
  - New Leaf item data in `public/data/acnl/` (PR #34)
  - New Horizons data: 81 fish, 80 bugs, 86 fossils, 43 art, 40 sea creatures (PR #35)
  - ACNL + ACNH game support in game selector (PR #36)
  - Hemisphere toggle for ACNH towns; store migrated to persist v3 (PR #42)
  - Item detail inline expand for fish/bugs/fossils; art opens bottom-sheet modal (PR #33, restored PR #46)
  - Detail modal backdrop fix — modal no longer closes immediately on open (PR #43)
  - Modal/switcher fixes: centering, iOS zoom, active-town duplicate, z-index (PR #41)

- v0.8.1-alpha — **shipped 2026-04-30**:
  - Edit Town modal fix — state lifted to ACCanvas, always-mounted pattern (PR #50, Closes #51)
  - TownNameFields shared component extracted
  - Edit/new-town buttons greyed out on museum category tabs (v0.8.1 stopgap, PR #50)
  - Issue tracking hygiene: bug filing workflow documented, backfilled issues #51–#53

- v0.8.2-alpha — **shipped 2026-05-01**:
  - Sea Creatures tab for ACNL and ACNH towns (PR #44, Closes #56)
  - Art tab persistent label fix — `setSelected(null)` on tab change (PR #57, Closes #26)
  - Branch-label footer suffix for non-main/development/release builds

### v0.9 — Polish, onboarding, and PWA (next)
- Seasonal/time-based filtering
- UI redesign pass; PWA support; mobile-first responsive pass; first-run onboarding

### v1.0 — Launch ready
- Branding, SEO, accessibility, performance audit

## Sister Project

Swift/Xcode version at `../AnimalCrossingGCN-Tracker` — reference for data models and original design intent.
