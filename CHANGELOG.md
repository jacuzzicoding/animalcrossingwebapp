# Changelog

All notable changes to this project are documented here.

## [v0.7.0-alpha] — In Progress

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

### Changed
- `AppErrorKind` unified across `ErrorBanner` and `ErrorState` — single discriminated union in `types.ts`
- `HomeTab` — replaced `as any` cast with `AnyItem` union type; fixed stale `React.ElementType` import
- ACCanvas per-category filter and global search now call `filterByQuery()` / `globalFilter()` from utils; inline reimplementations removed
- `Town` interface gains `gameId` field (defaults to `'ACGCN'` for new towns; backfilled for existing)

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
