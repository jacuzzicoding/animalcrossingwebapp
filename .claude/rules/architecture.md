# Architecture Reference (v0.8)

## Stack
Vite + React 19 + TypeScript + Tailwind CSS v4 + Zustand (persist middleware) + React Router v6

## Key Files
- `src/lib/store.ts` — Zustand store, persist v3, 3-level donation schema
- `src/lib/types.ts` — GameId union, Town, Game interface, GAMES registry
- `src/lib/constants.ts` — MONTH_NAMES, CATEGORY_LABELS, SEASONS (single source of truth)
- `src/lib/colors.ts` — design token hex constants
- `src/lib/categoryMeta.ts` — CATEGORY_META constant (label/Icon/file per category)
- `src/lib/viewTypes.ts` — ViewId and AllData types
- `src/lib/storeMigrations.ts` — Zustand migrate callback (v1→v2→v3; backfills gameId, then hemisphere)
- `src/lib/bootstrapMigration.ts` — one-time localStorage key rename, called in main.tsx before createRoot
- `src/hooks/useHydration.ts` — onFinishHydration guard, prevents flash of empty state
- `src/hooks/useMuseumData.ts` — fetches and caches all category JSONs for the active town's game (including sea creatures for ACNH); accepts `gameId` and fetches from `/data/<game>/`; re-fetches when active town's game changes
- `src/hooks/useSearch.ts` — search history, click-outside, debounce
- `src/hooks/useCategoryStats.ts` — memoized donated counts per category
- `src/components/ErrorBoundary.tsx` — wraps app root, crashes show ErrorState not blank page
- `src/components/ACCanvas.tsx` — ~298-line orchestration shell; decomposition complete (v0.7 PR #25); wires ItemExpandPanel inline-expand and DetailModal bottom-sheet
- `src/components/ItemExpandPanel.tsx` — inline accordion panel for Fish/Bugs/Fossils rows (month grid, bells, habitat, donate toggle)
- `src/components/shared/` — HabitatChip, DonateToggle, CategoryProgress, SearchBar, EmptyState, MonthGrid
- `src/components/modals/` — CreateTownModal (game selector, new town form), EditTownModal, DetailModal (bottom-sheet for Art + Search results)
- `src/components/views/` — AnalyticsView, ActivityFeed, SectionCard
- `src/components/search/` — GlobalSearchBar, GlobalSearchResults, SearchHistoryPopover
- `src/components/CollectibleRow.tsx`, `TownSwitcher.tsx`, `MuseumHeader.tsx`, `TabBar.tsx`
- `public/data/<gameId>/` — item data files for all 5 games: acgcn/, acww/, accf/, acnl/, acnh/ all present

## Store Schema (v3)
```
donated: Record<townId, Record<gameId, Record<itemId, boolean>>>
donatedAt: Record<townId, Record<gameId, Record<itemId, string>>>
towns: Town[]  // each Town has id, name, playerName, gameId, hemisphere ('NH'|'SH'), createdAt
```
CRITICAL: callers use getActiveTown().gameId to scope donations — store handles the 3rd level.
`hemisphere` defaults to 'NH'; only used for ACNH month display (months_nh / months_sh).

## Multi-Game Support
- GameId = 'ACGCN' | 'ACWW' | 'ACCF' | 'ACNL' | 'ACNH'
- Data files use game-local IDs (sea-bass in ACGCN == sea-bass in ACWW — schema handles scoping)
- Only show games with data files present in CreateTownModal

## Dev Preview
https://development-animalcrossingwebapp.vercel.app/ — auto-deploys from `development` branch via Vercel GitHub integration. Never run `vercel` CLI manually.

## Reference Docs
- docs/v0.7-audit.md — full ranked audit (P0/P1/P2)
- docs/v0.7-architecture-proposal.md — approved design decisions
- docs/dev-process.md — full dev process (this is the .claude/rules/ version)
