# Changelog

All notable changes to this project are documented here.

## [Unreleased]

## [v0.9.0-beta] — 2026-05-04

### Added
- **New "Meadow" visual design** — full UI rebuild on a fresh design system. Fraunces (display) + Inter (sans) replace Varela Round; new token palette covers surfaces, ink, accents, warnings, and per-category chip colors
- **Sidebar shell layout** — 280px sticky left sidebar with brand wordmark, active-town card, vertical nav with per-category `donated/total` counts, and Export CSV / Settings footer; replaces the old `MuseumHeader` + `TabBar` + `TownSwitcher` trio
- **TownManager drawer** — right-side drawer (bottom sheet ≤720px) for town CRUD; replaces the separate Create Town and Edit Town modals. Mounts at the layout level so it overlays every route, retiring the v0.8.1 greyed-out-buttons stopgap. Auto-opens in create mode when there are no towns
- **Settings page** (`/settings`) — top-level route with About (version, source, storage summary, credits) and Danger zone (reset active town's donations, reset everything)
- **HomeTab redesign** — hero stat ("X creatures still to donate this month"), leaving-soon aside, segmented `ProgressMeter`, 12-cell month strip, "Leaving end of {month}" and "Just arrived" shelves, and a Latest donations card. Shelf and recent-row clicks jump straight to the matching row in its category tab and pulse-highlight it
- **Category tab sectioning** — items group into Leaving this month / Available now / Out of season / Already donated, with a redesigned page header showing donated/total and current-month context
- **Restyled item rows + inline expand panel** — category-tinted monogram glyphs replace icon tiles; donated rows strike through and check off; expand panel shows a 12-cell month grid alongside sell value, shadow size, active hours, and the donate / undonate button. Active-hours and "Leaving soon" / "New this month" pills surface in-row
- **GlobalSearchDropdown** — unified search anchored under a topbar input on Home. Grouped results across fish/bugs/fossils/art/sea (sea gated on game + data), keyboard nav (↑↓/↵/Esc), and persisted recent-search history. Replaces the standalone Search tab
- **StatsTab** — replaces `AnalyticsView`. Per-category cards above a 12-month "Yearly rhythm" chart (background bar = items available that month, accent fill = donated). Hemisphere-aware; sea creatures included for ACNL/ACNH
- **Art data for Wild World and City Folk** (`public/data/acww/art.json`, `public/data/accf/art.json`) — 20 and 23 paintings respectively; loader and StatsTab grid updated. Closes #74
- **Mobile responsive polish** — breakpoint hierarchy (`980 / 720 / 700 / 480`), 44px minimum touch targets at ≤720px, iOS auto-zoom prevention on search inputs, hero/category title overflow handling, topbar wrap, and full-height sidebar foot links when the sidebar stacks above main

### Changed
- **Art tab uses inline expand** — art rows now expand inline like fish/bugs/fossils/sea creatures instead of opening a bottom sheet. Expand panel shows `basedOn` (real-world artwork) and an ACNH-only Crazy Redd authentication note keyed off `hasFake`. Closes #81
- **Town store API** — `createTown(name, gameId, hemisphere?)` and `updateTown(id, { name?, hemisphere? })`. `playerName` removed from `Town`, the store, CSV exports, and tests. `gameId` is immutable after creation
- **Hemisphere toggle** lives in TownManager (read-only label in the sidebar)

### Removed
- **`MuseumHeader`**, **`TabBar`**, **`TownSwitcher`** — replaced by the sidebar
- **`CreateTownModal`**, **`EditTownModal`**, **`TownNameFields`**, **`DetailModal`** — replaced by TownManager and the inline expand panel
- **`AnalyticsView`** and **`SectionCard`** — replaced by StatsTab
- **`GlobalSearchBar`**, **`GlobalSearchResults`**, **`SearchHistoryPopover`**, **`useSearch`** hook, and the standalone `/search` route — replaced by GlobalSearchDropdown
- **Varela Round** font — fully retired across `index.html`, `src/index.css`, `App.tsx`, and `version-history.html`

### Fixed
- **Version footer suppresses `release/` branch suffix** (#60) — the `· <branch>` suffix is hidden on `release/*` branches; production hostname behavior unchanged

## [v0.8.2-alpha] — 2026-05-01

### Added
- **Sea Creatures tab** (PR #44, Closes #56) — surfaces the 40-species sea creature data that shipped in v0.8.0 (PRs #34/#35). Tab appears in the TabBar for ACNL and ACNH towns only; hidden for all other games. Switching to a non-sea-creature game while on the Sea tab redirects to Home.
  - Sea creatures reuse the `CollectibleRow` + `ItemExpandPanel` path: month availability grid and sell value shown in the expand panel
  - Donation toggles persist to the 3-level store schema; donations carry through CSV export
  - Home tab progress grid includes a Sea Creatures card for ACNL/ACNH towns
  - Global search includes sea creatures
  - `SeaCreature` interface, `isSeaCreature` type guard, updated `AnyItem` union, `CategoryId`, `AllData`, `CATEGORY_ORDER`, `globalFilter`, `useCategoryStats`, and `csvExport` all extended
  - Tab label shortened to "Sea" in the TabBar to fit the narrow tab strip
- Branch-label footer suffix in the version display (`v0.8.2-alpha · feature/...`) — auto-hidden on `main`, `development`, and `release/` branches

### Cleanup
- **Detail modal now resets on tab change** (PR #57, Closes #26) — `setSelected(null)` added to the tab-change `useEffect` so an open art detail doesn't linger across tab switches. The original #26 repro (persistent label on the art tab) appears to have been resolved by the v0.8.0 backdrop fix (PR #43); this PR closes the issue since the reported symptom is no longer reproducible.

## [v0.8.1-alpha] — 2026-04-30

### Added
- `public/version-history.html` — styled version history &amp; roadmap page, now served at `/version-history.html` on the live site (previously untracked at repo root)
- `docs/decisions.md` — initial decision log with two entries: Sea Creatures data/UI split (v0.8 scope deferral, 2026-04-23) and edit-town modal grey-out on category tabs (PR #50, 2026-04-30)
- `package.json` description field populated with project summary and live URL
- **Filing & Closing Bugs** workflow documented in `docs/dev-process.md` (and `.claude/rules/dev-process.md`) — every bug-fix PR must have a corresponding issue using `Closes #N` for auto-close

### Fixed
- **Edit Town modal dismisses immediately on open** (Closes #51, PR #50) — `EditTownModal` was conditionally rendered inside `TownSwitcher`; the mount click bubbled to the backdrop `onClick`, unmounting it in the same tick. Modal state (`editing`) is now owned by `ACCanvas` alongside all other modal state; `EditTownModal` is always-mounted via `isOpen` prop, matching the pattern established for `CreateTownModal` and `DetailModal`.
- **`EditTownModal` form state sync** — form fields now sync from the active town via `useEffect` on `town.id`, so re-opening the modal after a rename always shows current values.
- **`createPortal` removed from `EditTownModal`** — no longer needed now that the modal is mounted at `ACCanvas` level rather than inside `TownSwitcher`.
- `docs/architecture.md` — header bumped to v0.8; stale ACCanvas block updated to post-decomposition reality (405 lines, orchestration shell)
- `docs/dev-process.md` and `.claude/rules/dev-process.md` — heading bumped from v0.7+ to v0.8+

### Refactored
- **`TownNameFields` shared component** (`src/components/shared/TownNameFields.tsx`) — extracted town name and player name inputs into a shared component used by both `CreateTownModal` and `EditTownModal`.
- **`TownSwitcher`** — removed `EditTownModal` import and local `editing` state; edit button now calls `onEditTown` prop.
- **`MuseumHeader`** — threads `onEditTown` prop through to `TownSwitcher`.
- **Greyed-out edit + new-town buttons on museum category tabs** — buttons are disabled (`opacity: 0.4`, `cursor: not-allowed`, `aria-disabled`) on Fish, Bugs, and Fossils tabs where modals can't render; tooltip explains where to go. Proper fix deferred to v0.9.

### Process
- Backfilled GitHub Issues for bugs fixed without tracking: #51 (edit-town modal bubble), #52 (DetailModal backdrop bubble, PR #43 — closed), #53 (inline-expand regression, PR #46 — closed)
- Closed stale issue #30 (town switcher duplicate — fixed by PR #41)
- Broadened scope of issue #31 (modal positioning affects all floating modals, deferred to v0.9); labelled `v0.9`; labelled issue #26 `v0.9`
- Created `regression` and `v0.9` labels in GitHub

## [v0.8.0-alpha] — 2026-04-29

### Added
- **React Router v6** (PR #38) — URL-based navigation replaces single-page state; each town and museum tab now has a shareable URL
  - Route structure: `/` → redirects to active town; `/town/:townId` → home tab; `/town/:townId/:tab` → specific tab
  - `BrowserRouter` wraps the app in `main.tsx`; `vercel.json` adds a catch-all SPA rewrite for preview/branch deploys
  - Tab switching and town switching both update the URL via `useNavigate`; browser back/forward navigate between tabs and towns
  - Deep links work — visiting `/town/<id>/fish` loads that town's fish tab directly
  - `CreateTownModal` navigates to the new town's URL after creation
- **New Leaf data** (PR #34) — `public/data/acnl/` with fish, bugs, and fossil data for Animal Crossing: New Leaf
- **New Horizons data** (PR #35) — `public/data/acnh/` with 81 fish, 80 bugs, 86 fossil pieces, 43 art pieces, and 40 sea creatures; fish/bugs/sea creatures include both Northern and Southern Hemisphere month availability (`months_nh` / `months_sh`); art pieces include `hasFake` flag for counterfeit detection
- **ACNL + ACNH game selector** (PR #36) — players can now choose Animal Crossing (GCN), Wild World, City Folk, New Leaf, or New Horizons when creating a new town; `CreateTownModal` derives game list dynamically from `Object.keys(GAMES)` rather than a hardcoded array; `categoryMeta.ts` updated with ACNL and ACNH data paths and art support
- **Hemisphere toggle** (PR #42) — per-town NH/SH toggle in the museum header for ACNH towns; `itemMonths` resolves `months_nh` / `months_sh` based on the active hemisphere; ACNL correctly marked as non-hemisphere-aware; store migrated to persist v3 with `hemisphere: 'NH'` backfilled for all existing towns
- **Item detail inline expand** (PR #33, restored in PR #46) — clicking a fish, bug, or fossil row expands it in-place: month availability grid, sell value, habitat (fish), and notes. Art rows open the existing bottom-sheet modal. Donate/undonate button included in the expand panel. Expand state resets on tab change.
  - `src/components/ItemExpandPanel.tsx` — inline accordion panel component
  - `CollectibleRow` — chevron indicator and rounded-top-only corners when expanded

### Fixed
- **Inline expand regression** (PR #46) — `ItemExpandPanel` import, `expandedId` state, and expand/collapse logic were stripped from `ACCanvas.tsx` during the React Router refactor; fully restored
- **Detail modal backdrop closes immediately** (PR #43) — modal backdrop received the same click event that mounted it (React 18 synchronous flush); fixed by deferring backdrop `onClick` by one event-loop tick via `useRef` + `setTimeout(0)`; also added `type="button"` to `CollectibleRow`
- **Create Town modal centering + iOS zoom** (PR #41) — overlay uses `flex items-center justify-center`; input font-size set to 16px to prevent iOS auto-zoom
- **Town switcher dropdown escapes header clip** (PR #41) — panel uses `position: fixed` with `getBoundingClientRect()` anchor; z-index layering: dismiss overlay `z-40`, dropdown `z-50`
- **Active town duplicate in switcher** (PR #41) — active town filtered out of dropdown list
- **Town switcher stale-state duplicates** (PR #41) — modals use always-mounted `isOpen` pattern instead of conditional render
- **Vite build in Vercel preview environments** — `vite.config.ts` falls back to `'unknown'` when `git rev-parse` fails (no `.git` in Vercel build sandbox)

## [v0.7.0-alpha] — 2026-04-17

### Added
- **Game selection UI** — `CreateTownModal` now shows a visual card selector for available games (ACGCN, ACWW); only games with data files under `public/data/` are shown; defaults to the most recent town's game or ACGCN; selected `gameId` is saved to the town on creation
- **Game badges in town switcher** — each town in the dropdown now shows a small coloured badge with the game's short name (e.g. "Wild World", "Animal Crossing")
- **Version bump** — `package.json` updated to `0.7.0-alpha`
- **Build version badge** — version string (from `package.json` via `VITE_APP_VERSION`) displayed in small muted text at the bottom of the museum canvas; `vite.config.ts` injects version at build time
- **Edit/rename town** — inline edit flow for town names; pencil icon in town switcher opens modal
- **Wild World data** — `public/data/acww/` with 56 fish, 56 bugs, and 52 fossils; item IDs shared with GCN where species overlap
- **City Folk data** — `public/data/accf/` with 40 fish, 40 bugs, and 52 fossils; item IDs shared with GCN/WW where species overlap
- **ACCanvas decomposition (Steps 4–8):** `ACCanvas.tsx` reduced from ~2175 lines to 298 lines (thin orchestration shell). Extracted into focused modules:
  - `src/lib/categoryMeta.ts` — `CATEGORY_META` constant (label/Icon/file per category)
  - `src/lib/viewTypes.ts` — `ViewId` and `AllData` types
  - `src/components/shared/` — `EmptyState`, `HabitatChip`, `DonateToggle`, `MonthGrid`, `SearchBar`, `CategoryProgress`
  - `src/components/modals/` — `CreateTownModal`, `EditTownModal`, `DetailModal`
  - `src/components/search/` — `GlobalSearchBar`, `GlobalSearchResults`, `SearchHistoryPopover`
  - `src/components/views/` — `AnalyticsView`, `ActivityFeed`, `SectionCard`
  - `src/components/CollectibleRow.tsx`, `TownSwitcher.tsx`, `MuseumHeader.tsx`, `TabBar.tsx`
  - `src/hooks/useMuseumData.ts`, `useSearch.ts`, `useCategoryStats.ts`
- **Multi-game foundation (Steps 1–3):**
  - `GameId` union type (`ACGCN | ACWW | ACCF | ACNL | ACNH`) + `Game` interface and `GAMES` registry
  - 3-level donation schema: `donated[townId][gameId][itemId]`; Zustand persist upgraded to v2 with lossless migration
  - `src/lib/bootstrapMigration.ts` — one-time localStorage key rename before React mounts
  - `src/lib/storeMigrations.ts` — Zustand v1→v2 migration; backfills `gameId = 'ACGCN'` for existing towns
  - `src/lib/constants.ts` — `MONTH_NAMES`, `CATEGORY_LABELS`, `CATEGORY_ORDER`, `SEASONS`
  - `src/lib/colors.ts` — design token hex constants
  - `src/hooks/useHydration.ts` — hydration guard via `onFinishHydration`; eliminates empty-state flash
- **ErrorBoundary** (`src/components/ErrorBoundary.tsx`) — top-level React error boundary; unhandled crashes render `ErrorState`
- **Pre-commit hooks** — Husky + lint-staged; ESLint + Prettier run on staged `src/**/*.{ts,tsx}` before every commit
- `docs/v0.7-audit.md` — comprehensive codebase audit covering component modularity, type safety, state management, latent bugs, and multi-game architectural readiness
- `docs/v0.7-architecture-proposal.md` — multi-game foundation design: store schema, decomposition plan for ACCanvas

- **Game-aware museum data loading** — `useMuseumData` now accepts a `gameId` and fetches from the correct `/data/<game>/` directory; re-fetches automatically when the active town's game changes. Art tab is hidden for games without art data (ACWW, ACCF). If the user was on the art tab and switches to a non-GCN town, the tab resets to Home.

### Changed
- `AppErrorKind` unified across `ErrorBanner` and `ErrorState` — single discriminated union in `types.ts`
- `HomeTab` — replaced `as any` cast with `AnyItem` union type; fixed stale `React.ElementType` import
- ACCanvas per-category filter and global search now call `filterByQuery()` / `globalFilter()` from utils; inline reimplementations removed
- `Town` interface gains `gameId` field (defaults to `'ACGCN'` for new towns; backfilled for existing)

### Infrastructure
- **ESLint config** — added `varsIgnorePattern: '^_'` so intentionally unused `_`-prefixed variables don't error; added Vitest/Jest globals for test files
- **Prettier** — auto-format applied across `src/` post-merge
- **`.gitignore`** — added `.DS_Store`, `.claude/worktrees/`, `.claire/`

### Fixed
- **Seasonal analytics bug (#1)** — "Seasonal Breakdown" section in Stats tab now counts
  donated fish/bugs available *in-game per season* (based on `months[]` data), not the
  timestamps of when items were donated. Previously everything showed as Spring because
  all donations were recorded in April.
- **Edit Town modal visual polish** — modal now renders via React portal to `document.body`,
  escaping the `overflow-hidden` header stacking context that caused visual clipping.
- **Missing `@vercel/analytics` dependency** — package was referenced in `App.tsx` but not
  installed; added to dependencies so the build no longer fails.
- **Type safety** — `isFish()`, `isFossil()`, `isArtPiece()` type guards in `utils.ts`; `itemNotes()` no longer does an unsafe `as FishType` cast

---

## [v0.6.1] — April 15th, 2026 (Hotfix)

### Fixed
- Restored files deleted during bad v0.6.0 merge into main
- Fixed corrupted main branch state left by prior merge conflict
- Home screen tab routing stability improvements

---

## [v0.6.0] — April 13th, 2026

### Added
- **Home screen tab** with seasonal availability overview
- "Available this month" section showing fish/bugs catchable right now
- "Leaving soon" section highlighting creatures departing at month's end
- Progress overview cards for each museum category (Fish, Bugs, Fossils, Art)
- Recent donation activity feed on home screen

---

## [v0.5.0] — April 13th, 2026

### Added
- **CSV export** — download your donation records as a spreadsheet
- **Error banner** (`ErrorBanner.tsx`) — dismissible inline error notifications
- **Error state** (`ErrorState.tsx`) — full-page fallback UI for load failures
- **Vitest test suite** — unit tests for store actions (`store.test.ts`) and utilities (`utils.test.ts`)
- **Vercel Analytics** — visitor and page view tracking
- **Monthly availability chart** — visual timeline of fish/bug availability by month
- Enriched `fish.json` and `bugs.json` with `months[]` availability arrays
- Month abbreviations displayed in fish/bug detail rows

---

## [v0.4.0] — April 13th, 2026

### Added
- **Global search** — search across all museum categories from a single input with history popover
- **Stats tab** — analytics dashboard with collection progress, monthly timeline, and seasonal breakdown

---

## [v0.3.0] — April 13th, 2026

### Added
- **Multi-town management** — create and switch between multiple towns
- `TownSwitcher` component wired to the header
- Create Town modal
- Donations keyed by `townId` in the Zustand store
- Activity feed tracking recent donations per town

### Infrastructure
- Added `vercel.json` for correct Vite build config on Vercel
- Removed the Expo/React Native parallel app — Vite/React is the sole codebase

---

## [v0.2.0] — April 12th, 2026

### Added
- Detail modal for individual museum items
- Search/filter within each category tab
- Donation timestamps — records when each item was donated
- Full four-category museum tracking UI (Fish, Bugs, Fossils, Art) in `ACCanvas.tsx`

---

## [v0.1.0] — April 10th, 2026

### Added
- Initial release
- Basic museum donation tracking for all four categories
- Four-tab navigation (Fish / Bugs / Fossils / Art)
- Zustand store with `persist` middleware (localStorage)
- Cozy parchment/GameCube museum aesthetic with inline hex design tokens
- Data files: `fish.json` (40 species), `bugs.json` (40 species), `fossils.json` (25 items), `art.json` (13 paintings)
- GitHub CI workflow and Vercel deployment
