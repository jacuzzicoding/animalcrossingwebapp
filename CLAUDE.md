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
Meadow design language (Fraunces + Inter, moss-green accent) as of v0.9. **Current release: v0.9.2-beta (2026-05-05) — cross-game icon routing (flat hierarchy + RENAME_OVERRIDES), first two hand-drawn icons (sea bass, koi), bigger expand-panel icons, `npm run icons:export` pipeline, ActivityFeed migrated to `<ItemIcon>`. Previous: v0.9.1-beta (ACGCN item icons), v0.9.0-beta (full UI revamp). See `docs/v0.9-plan.md`, `docs/v0.9.1-icons-plan.md`, and `docs/v0.9.2-icon-routing-plan.md` for plans, `CHANGELOG.md` for the full entries.**
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
**Styling:** Tailwind CSS v4 + Meadow CSS custom properties (`@theme` block in `src/index.css`); design tokens mirrored as the `meadow` export in `src/lib/colors.ts`. Fraunces (display) + Inter (UI) loaded via Google Fonts. Varela Round retired in v0.9 Phase 1. Legacy `colors` export retained until all consumers are removed.  
**State:** Zustand ^5 with `persist` middleware (localStorage key: `ac-web`, schema v3) for app data; non-persisted `useUIStore` (`src/lib/uiStore.ts`) for transient UI state (TownManager open/forceCreate flags).  
**Routing:** React Router v6 (`BrowserRouter`); URL structure: `/` → redirect, `/town/:townId` → home tab, `/town/:townId/:tab` → specific tab; `vercel.json` has catch-all SPA rewrite for preview/branch deploys  
**Tests:** Vitest  
**Store schema:** 3-level `donated[townId][gameId][itemId]` (as of v0.7); `Town` includes `hemisphere: 'NH' | 'SH'` (as of v0.8)  
**Migration:** Zustand persist v3 + `bootstrapMigration.ts` — zero data loss for existing users  
**Town CRUD (v0.9 Phase 4):** `TownManager` drawer mounts at the App layout level (above the router), opened via `useUIStore.openTownManager()`. Replaces `CreateTownModal`, `EditTownModal`, and the `TownSwitcher` dropdown. When `towns.length === 0`, App.tsx auto-opens it in `forceCreate` mode (no close/Esc/scrim dismissal). Per Decision 1, edit form has no game `<select>` — game is read-only post-create.  
**Shell layout (v0.9 Phase 2):** `Sidebar` (280px left, sticky) + `<main className="ac-main">` in CSS grid `280px 1fr`, max-width 1440px centered. Below 980px sidebar stacks above main. `MuseumHeader`, `TabBar`, `TownSwitcher` retired — nav lives in the sidebar.  
**Mobile breakpoints (v0.9 Phase 10):** `980` = sidebar stacks + ProgressMeter 5-seg wraps + stats grid → 2 col; `720` = TownManager bottom-sheet + touch targets ≥44px + recent-row strips category label + GlobalSearch kbd footer hidden; `700` = settings sections collapse + danger buttons full-width; `480` = stats grid → 1 col + hero/category titles shrink + topbar wraps. Edits are CSS-only in `src/index.css` Phase 10 block.  
**Scroll-to + highlight (v0.9 Phase 5/6/8):** `ACCanvas` owns `highlightId` state. `HomeTab` shelves and `GlobalSearchDropdown` results call `jumpTo(category, id)` (via `useJumpToRow`); `CategoryTab` opens the matching row, scrolls it into view (`block: 'center'`, smooth) on the next animation frame, and adds `.ac-row-pulse` (1.4s `@keyframes ac-row-pulse`). Rows stamp `data-row-id={item.id}` so the effect can locate them. See locked decision #10 in `docs/v0.9-plan.md`.  
**Search (v0.9 Phase 8):** `GlobalSearchDropdown` is mounted only on the Home tab inside an `.ac-topbar`. Other tabs use `CategoryTab`'s inline per-tab `SearchBar`. Search history persists at localStorage key `ac-curator-search-history` (max 8, deduplicated).

### File Structure

```
src/
  App.tsx                   # Root component — hydration guard + ErrorBoundary + Routes (/, /town/:townId/:tab)
  main.tsx                  # Entry point — runs bootstrapMigration, wraps app in BrowserRouter
  components/
    ACCanvas.tsx            # Orchestration shell. Mounts active tab view; owns
                            # `highlightId` state for scroll-to + pulse; wires
                            # GlobalSearchDropdown topbar (Home only). All categories,
                            # including art, use ItemExpandPanel inline expand (v0.9 #81).
    HomeTab.tsx             # v0.9 Phase 6: rebuilt — hero stat + ProgressMeter,
                            # month strip, leaving-soon shelf, just-arrived shelf,
                            # latest donations. Cards fire jumpTo (scroll + pulse).
    ProgressMeter.tsx       # v0.9 Phase 6: segmented progress bar (4 or 5 segments
                            # gated by gameId; sea segment for ACNL/ACNH).
    progressMeterUtils.ts   # Pure helper segmentsForGame (unit-tested).
    CategoryTab.tsx         # v0.9 Phase 7: sectioned category page (Leaving / Available
                            # / Out of season / Already donated). Owns expandedId,
                            # reacts to highlightId by opening the matching row
                            # before ACCanvas's scroll-to fires. Hosts per-tab SearchBar.
    CollectibleRow.tsx      # v0.9 Phase 5 restyle: monogram glyph tile, meta line with
                            # `·` separators, leaving/new pills, animated chevron.
                            # Stamps data-row-id; accepts highlighted/currentMonth/hemisphere props.
    ItemExpandPanel.tsx     # v0.9 Phase 5 rebuild: two-column inline panel (MonthGrid
                            # + stats stack with bells/shadow/hours/notes) with the
                            # donate / undonate button at the bottom. Donate UI lives
                            # in the panel only — the row no longer renders a toggle.
    ItemIcon.tsx            # v0.9.1: shared item icon — manifest-resolved, layout-reserved,
                            # fallback to monogram placeholder on miss/error.
    itemIconUtils.ts        # v0.9.1: data-driven icon gate (`useGameHasIcons`) — probes
                            # /icons/<gameId>/manifest.json lazily, caches a tri-state
                            # (unknown/present/absent) at module scope. New games light up
                            # automatically when their manifest.json lands; no code change.
    Sidebar.tsx             # v0.9 Phase 2: 280px left sidebar — brand, active town card, NavLink nav with counts, footer (replaces MuseumHeader/TabBar/TownSwitcher)
    SettingsPage.tsx        # v0.9 Phase 3: full-page Settings — About + Danger zone (no Appearance per locked decision #3)
    SettingsRoute.tsx       # v0.9 Phase 3: route wrapper that mounts Sidebar + SettingsPage at /settings
    ErrorBanner.tsx         # Dismissible inline error notification
    ErrorBoundary.tsx       # Top-level React error boundary; crashes render ErrorState
    ErrorState.tsx          # Full-page error fallback UI
    shared/
      DonateToggle.tsx      # Checkbox/button to mark item donated (used by sea-creature search rows; donate on category rows is panel-only as of Phase 5)
      EmptyState.tsx        # "Nothing here yet" placeholder
      HabitatChip.tsx       # Fish habitat badge
      MonthGrid.tsx         # 12-cell month availability grid (Phase 5 re-skin; accepts `current` prop)
      SearchBar.tsx         # Per-tab inline search input (consumed by CategoryTab)
      # CategoryProgress.tsx — DEAD: its only consumers (ACCanvas inline category
      # render + AnalyticsView) were retired in Phase 7 / Phase 9. File remains
      # in tree pending a follow-up cleanup PR.
    modals/
      # DetailModal.tsx — RETIRED in v0.9 (#81). Was the bottom-sheet for the Art
      # tab; art now uses the inline ItemExpandPanel like every other category.
    TownManager.tsx         # v0.9 Phase 4: right-side drawer (bottom sheet ≤720px) mounted
                            # at App layout level via useUIStore. Switch/edit/create/delete
                            # towns. Inline edit = name + (ACNH-only) hemisphere — game is
                            # read-only post-create (Decision 1). Replaces CreateTownModal,
                            # EditTownModal, TownSwitcher, TownNameFields.
    StatsTab.tsx            # v0.9 Phase 9: per-category cards (3/4/5 by game) +
                            # 12-column yearly rhythm chart (fish + bugs always,
                            # sea added for ACNL/ACNH). Replaces AnalyticsView.
    views/
      ActivityFeed.tsx      # Recent donations list (consumed by HomeTab).
                            # AnalyticsView + SectionCard retired in Phase 9.
    search/
      GlobalSearchDropdown.tsx # v0.9 Phase 8: unified search dropdown — anchored
                               # under the Home topbar input. Grouped category
                               # results (5 groups for ACNL/ACNH, 4 elsewhere),
                               # keyboard nav (↑↓↵esc), localStorage history
                               # under `ac-curator-search-history` (max 8).
                               # Replaces GlobalSearchBar/Results/HistoryPopover.
  hooks/
    useHydration.ts         # Gates render on Zustand persist rehydration (onFinishHydration)
    useMuseumData.ts        # Fetches and caches all category JSONs for the active town's game
    useCategoryStats.ts     # Memoized donated counts per category
    useJumpToRow.ts         # v0.9 Phase 6: navigate to a category tab + set
                            # highlightId so ACCanvas scrolls + pulses the target row.
                            # Wired by HomeTab shelves and GlobalSearchDropdown.
                            # `useSearch.ts` retired in Phase 8 — search state now
                            # lives inside GlobalSearchDropdown.
  lib/
    store.ts                # Zustand app store: towns, donations, activeTownId. persist
                            # key 'ac-web' schema v3. Includes resetActiveTownDonations
                            # + resetAll (Phase 3 Settings danger zone). createTown signature
                            # is (name, gameId, hemisphere?); updateTown takes a TownPatch
                            # ({ name?, hemisphere? }) — gameId is intentionally not patchable
                            # post-create (Decision 1). `playerName` removed from Town in
                            # Phase 4 (Decision 5).
    uiStore.ts              # v0.9 Phase 4: non-persisted Zustand store for transient UI
                            # state (`townManagerOpen`, `townManagerForceCreate`).
    bootstrapMigration.ts   # One-time localStorage rename (ac-web:v1 → ac-web), called in main.tsx
    storeMigrations.ts      # Zustand migrate callback: v1→v2 schema lift, v2→v3 hemisphere backfill
    categoryMeta.ts         # CATEGORY_META constant (label/Icon/file per category)
    viewTypes.ts            # ViewId and AllData types
    constants.ts            # MONTH_NAMES, CATEGORY_LABELS, CATEGORY_ORDER, SEASONS
    colors.ts               # Design tokens — `meadow` export (v0.9 Phase 1) mirrors the CSS custom properties in `src/index.css` `@theme`. Legacy `colors` export kept until all consumers are removed. Includes `fontStacks` for Fraunces/Inter.
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
icon-sources/                # 2048×2048 hand-drawn PNG originals — committed (not gitignored).
                             # Mirrors public/icons/ layout: `<category>/<id>.png`.
                             # Run `npm run icons:export` to regenerate the 512 deploy assets.
docs/
  dev-process.md            # PR checklist and dev process rules for Claude Code sessions
  architecture.md           # Deep architectural context: store schema, migrations, multi-game types
  decisions.md              # Reverse-chronological design decision log
  v0.9-plan.md              # Canonical v0.9.0-beta implementation plan + locked decisions
  design-handoffs/          # v0.9 / v0.9.1 / v0.9.2 design specs ("Curator" codename)
  v0.7-audit.md             # Codebase audit: component modularity, type safety, latent bugs
  v0.7-architecture-proposal.md  # Multi-game foundation design: store schema, decomposition plan
```

### Design System (Meadow — v0.9)

Tokens are CSS custom properties in `src/index.css` `@theme` block, mirrored in `src/lib/colors.ts` as the `meadow` export. The legacy `colors` export (parchment/wood) is retained for backwards-compatibility but is no longer the active palette. See section 5 of `docs/v0.9-plan.md` for the full token table and typographic scale.

Key tokens:
- `--bg` `#F4EFE3` · `--surface` `#FFFDF7` · `--surface-alt` `#F8F2E2`
- `--ink` `#23241F` · `--ink-soft` `#5C5848` · `--ink-muted` `#8A8470`
- `--border` `#E2D9C3` · `--border-strong` `#CFC4A8`
- `--accent` `oklch(0.55 0.09 150)` (moss green) · `--accent-soft` · `--accent-ink`
- `--warn` `oklch(0.62 0.12 50)` (clay) — leaving-soon
- `--chip-fish` / `--chip-bugs` / `--chip-fossils` / `--chip-art` / `--chip-sea` — category identity tokens

Type stack: **Fraunces** (display, opsz 9..144, 400/500/600 + italic) and **Inter** (UI, 400/500/600/700) loaded via Google Fonts. Varela Round was retired in Phase 1.

Per locked decision #2, Meadow is the **only theme** — Parchment, Midnight, and Sakura were dropped from the v0.9 scope.

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

`src/components/ACCanvas.tsx` is the orchestration shell that lives below the `Sidebar`. It mounts the active tab view (HomeTab, CategoryTab, StatsTab), owns the `highlightId` state for the scroll-to + pulse effect (Phase 5/6/8), and wires the GlobalSearchDropdown topbar (Home tab only). All categories — including art — now use the inline `ItemExpandPanel` (v0.9 #81; `DetailModal` retired). All data fetching lives in `useMuseumData`; per-category filtering and sectioning lives in `CategoryTab`.

Do not add new top-level tabs without updating the tab switch in ACCanvas, the nav list in `Sidebar`, and `VALID_TABS` / `ViewId` in `src/lib/viewTypes.ts`.

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

### v0.9.0-beta — UI revamp (in progress on `development`)
Phases shipped to `development`:
- Phase 1 — Meadow tokens + Fraunces/Inter; Varela Round retired (PR #63)
- Phase 2 — Sidebar shell; MuseumHeader/TabBar/TownSwitcher retired (PR #65)
- Phase 3 — Settings page (About + Danger zone) (PR #66)
- Phase 4 — TownManager drawer; CreateTownModal/EditTownModal/TownNameFields retired; `playerName` removed from Town (PR #67)
- Phase 5 — CollectibleRow + ItemExpandPanel restyle; donate moves into expand panel (PR #70)
- Phase 6 — HomeTab rebuild + ProgressMeter (4/5 segments); closed Issue #71 ACNH "all caught up" bug (PR #72)
- Phase 7 — CategoryTab sectioning (Leaving / Available / Out of season / Already donated) (PR #73)
- Phase 8 — GlobalSearchDropdown; GlobalSearchBar/Results/HistoryPopover/`useSearch` retired; a11y polish tracked in Issue #76 (PR #75)
- Phase 9 — StatsTab rebuild; AnalyticsView + SectionCard retired (PR #77)

Pending:
- Phase 10 — Mobile responsive verification pass
- ACWW + ACCF art data (PR #78, closes Issue #74)

### v0.9.1-beta — Item icons (in progress)
- PR (a) — Fandom scraper, `OVERRIDES` map, full ACGCN icon set committed under `public/icons/acgcn/` with per-game `manifest.json` (PR #86, shipped)
- PR (b) — `<ItemIcon>` component + UI wiring in CollectibleRow / ItemExpandPanel / GlobalSearchDropdown / HomeTab; `scripts/generate-icon-manifest.ts` standalone re-emitter; `GAMES_WITH_ICONS` gate scoped to ACGCN until other games' icon scrapes ship (this PR)
- PR (c) — `NOTICE` at the repo root + in-app `/credits` route + release prep (pending)

### v0.9.2-beta — Hand-drawn icons (in progress)
- PR #94 (shipped) — flat icon hierarchy + cross-game routing simplification + first two hand-drawn icons (fish/sea-bass, fish/koi) optimized 2048→512 with sharp + pngquant
- PR (b) — bumped icon render sizes (rows 48, expand panel 192, search/home 32) + `scripts/export-icons.ts` reproducible pipeline + 2048 originals committed to `icon-sources/` (this PR)

### v1.0 — Launch ready
- Branding, SEO, accessibility, performance audit

## Sister Project

Swift/Xcode version at `../AnimalCrossingGCN-Tracker` — reference for data models and original design intent.
