# Changelog

All notable changes to this project are documented here.

## [v0.7.0] — In Progress

### Added
- `docs/v0.7-audit.md` — comprehensive codebase audit covering component modularity, type safety, state management, latent bugs, and multi-game architectural readiness
- **Multi-game foundation — Steps 1–3** (v0.7 architecture, PR targeting development):
  - `src/lib/types.ts` — `GameId` expanded to union of all 5 games (`ACGCN | ACWW | ACCF | ACNL | ACNH`); `Game` interface and `GAMES` registry added
  - `src/lib/constants.ts` — `MONTH_NAMES`, `CATEGORY_LABELS`, `CATEGORY_ORDER`, `SEASONS` extracted from ACCanvas
  - `src/lib/colors.ts` — design token hex constants (`wood`, `paper`, `ink`, `leaf`, `border`, `muted`)
  - `src/lib/bootstrapMigration.ts` — one-time localStorage key rename (`ac-web:v1` → `ac-web`) called synchronously in `main.tsx` before `createRoot`
  - `src/lib/storeMigrations.ts` — Zustand `migrateStore` function (v1→v2): backfills `Town.gameId = 'ACGCN'`, lifts `donated`/`donatedAt` to 3-level schema (`townId → gameId → itemId`)
  - `src/hooks/useHydration.ts` — `useHydration()` hook via `onFinishHydration`; gates `App.tsx` render to prevent empty-state flash for returning users
- `Town` now carries `gameId: GameId` (defaults to `'ACGCN'` for existing and new towns)
- Zustand persist store upgraded to `version: 2` with lossless migration — zero data loss for existing users
- **ErrorBoundary** — top-level React error boundary wraps `<ACCanvas />`; crashes now render `ErrorState` instead of a blank page
- **Pre-commit hooks** — Husky + lint-staged run ESLint and Prettier on staged `src/**/*.{ts,tsx}` files before every commit
- **Type guards in utils** — `isFish()`, `isFossil()`, `isArtPiece()` predicates replace unsafe `as` casts; `itemNotes()` now returns `undefined` for non-fish items correctly
- **Unified `AppErrorKind`** — moved to `src/lib/types.ts`; `ErrorState` now accepts the full discriminated union instead of a separate `LoadErrorKind` string
- `public/data/acww/` — complete Animal Crossing: Wild World game data (56 fish, 56 bugs, 52 fossils). Item IDs are shared with GCN where species overlap, enabling the multi-game data model. New species unique to Wild World include: Dorado, Gar, Char, King Salmon, Sea Butterfly, Clownfish, Zebra Turkeyfish, Football Fish, Tuna, Ocean Sunfish, Hammerhead Shark, Shark, Yellow Perch, Black Bass, and more (see PR for full breakdown).

### Fixed
- **`as any` cast in HomeTab** — `displayName(item as any, cat)` replaced with `displayName(item as AnyItem, cat)`
- **`filterByQuery` duplication** — ACCanvas per-category filter and global search filter now use the `filterByQuery()` / `globalFilter()` utilities from `src/lib/utils.ts` instead of reimplementing the same logic inline

### Fixed
- **Seasonal analytics bug (#1)** — "Seasonal Breakdown" section in Stats tab now counts
  donated fish/bugs available *in-game per season* (based on `months[]` data), not the
  timestamps of when items were donated. Previously everything showed as Spring because
  all donations were recorded in April.
- **Edit Town modal visual polish** — modal now renders via React portal to `document.body`,
  escaping the `overflow-hidden` header stacking context that caused visual clipping.
- **Missing `@vercel/analytics` dependency** — package was referenced in `App.tsx` but not
  installed; added to dependencies so the build no longer fails.

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
