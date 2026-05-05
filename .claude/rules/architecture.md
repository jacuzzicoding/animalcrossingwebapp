# Architecture Reference (v0.9.2-beta)

## Stack
Vite + React 19 + TypeScript + Tailwind CSS v4 + Zustand (persist + non-persisted UI store) + React Router v6. Meadow design tokens (CSS custom properties in `src/index.css` `@theme`); Fraunces (display) + Inter (UI).

## Key Files

### State + data
- `src/lib/store.ts` — Zustand app store, persist key `ac-web` schema v3, 3-level donation schema. `createTown(name, gameId, hemisphere?)`, `updateTown(id, patch: { name?, hemisphere? })` — `gameId` is intentionally not patchable post-create (Decision 1). Includes `resetActiveTownDonations()` + `resetAll()` for the Phase 3 Settings danger zone.
- `src/lib/uiStore.ts` — non-persisted Zustand store for transient UI state (`townManagerOpen`, `townManagerForceCreate`).
- `src/lib/types.ts` — GameId union, `Town` (no longer has `playerName` — removed in Phase 4 / Decision 5), Game interface, GAMES registry, GAME_LIST.
- `src/lib/constants.ts` — MONTH_NAMES, CATEGORY_LABELS, CATEGORY_ORDER, SEASONS.
- `src/lib/colors.ts` — `meadow` token export (mirrors CSS custom properties), `fontStacks` for Fraunces/Inter, legacy `colors` retained until consumers retire.
- `src/lib/categoryMeta.ts` — CATEGORY_META (label / Icon / file / data presence per game).
- `src/lib/viewTypes.ts` — ViewId union and AllData shape. Phase 8 removed the `'search'` route.
- `src/lib/storeMigrations.ts` — Zustand migrate callback v1→v2 (gameId backfill) and v2→v3 (hemisphere backfill).
- `src/lib/bootstrapMigration.ts` — one-time localStorage key rename, called in main.tsx before createRoot.

### Hooks
- `src/hooks/useHydration.ts` — onFinishHydration guard.
- `src/hooks/useMuseumData.ts` — fetches all category JSONs for the active town's game (sea creatures included for ACNL/ACNH); re-fetches when active town's game changes.
- `src/hooks/useCategoryStats.ts` — memoized donated counts per category.
- `src/hooks/useJumpToRow.ts` — Phase 6 navigation helper. Pushes `/town/:townId/:tab` and sets `highlightId` on the next animation frame; ACCanvas's effect picks up the change and scrolls + pulses the matching row.
- (`useSearch` retired in Phase 8 — search state lives inside GlobalSearchDropdown.)

### Components — shell
- `src/components/Sidebar.tsx` — 280px sticky left sidebar (Phase 2). Brand, active-town card, NavLink nav with per-category counts, Export CSV / Settings footer. "Switch town ›" opens TownManager via useUIStore.
- `src/components/TownManager.tsx` — right-side drawer (bottom sheet ≤720px) mounted at App layout level (Phase 4). Switch / inline-edit / create / delete towns. Edit form is name + (ACNH-only) hemisphere; game is read-only post-create.
- `src/components/SettingsPage.tsx` + `SettingsRoute.tsx` — `/settings` route (Phase 3). About + Danger zone only (no Appearance, Decision 3).
- `src/components/ACCanvas.tsx` — orchestration shell. Owns `highlightId` state. Mounts active tab; wires GlobalSearchDropdown topbar (Home only). All categories (including art) use the inline `ItemExpandPanel` as of v0.9 (#81).
- `src/components/ErrorBoundary.tsx` / `ErrorBanner.tsx` / `ErrorState.tsx`.

### Components — tabs
- `src/components/HomeTab.tsx` — Phase 6 rebuild. Hero stat + ProgressMeter, month strip, "Leaving end of {month}" shelf, "Just arrived" shelf, latest donations. Cards fire `jumpTo`.
- `src/components/CategoryTab.tsx` — Phase 7. Sections: Leaving this month / Available now / Out of season / Already donated. Owns expandedId; reacts to `highlightId`. Hosts per-tab `SearchBar`. All categories (including art) use the inline `ItemExpandPanel` as of v0.9 (#81).
- `src/components/StatsTab.tsx` — Phase 9. Per-category cards (3/4/5 by game) + 12-column yearly rhythm chart. Replaces AnalyticsView.
- `src/components/ProgressMeter.tsx` (+ `progressMeterUtils.ts`, `ProgressMeter.test.ts`) — Phase 6. 4 segments (fish/bugs/fossils/art) for ACGCN/ACWW/ACCF; 5 segments (+ sea) for ACNL/ACNH. `.ac-meter-5` modifier handles responsive wrapping.

### Components — rows + panels
- `src/components/CollectibleRow.tsx` — Phase 5 restyle. Monogram glyph, meta line with `·` separators, leaving/new pills, animated chevron. Stamps `data-row-id`. Donate UI lives in the expand panel only.
- `src/components/ItemExpandPanel.tsx` — Phase 5 rebuild. Two-column grid: MonthGrid + stats stack (bells / shadow / hours / notes) + donate button.
- `src/components/shared/` — DonateToggle, EmptyState, HabitatChip, MonthGrid (Phase 5 re-skin, accepts `current` prop), SearchBar (per-tab, used by CategoryTab). `CategoryProgress.tsx` is dead — file remains pending cleanup.
- `src/components/modals/` — DetailModal **retired in v0.9 (#81)**; file deleted. Art now uses the inline `ItemExpandPanel` like every other category.
- `src/components/views/ActivityFeed.tsx` — recent donations list (consumed by HomeTab). `AnalyticsView` and `SectionCard` retired in Phase 9.
- `src/components/search/GlobalSearchDropdown.tsx` — Phase 8 unified search dropdown (anchored under Home topbar). Grouped category results (5 groups for ACNL/ACNH, 4 elsewhere), keyboard nav (↑↓↵esc), search history at localStorage key `ac-curator-search-history` (max 8). Replaces GlobalSearchBar / GlobalSearchResults / SearchHistoryPopover.

### Data
- `public/data/<gameId>/` — `acgcn/`, `acww/`, `accf/`, `acnl/`, `acnh/` all present. Sea creatures for ACNL + ACNH. Art for ACGCN + ACNH today; ACWW + ACCF art incoming via PR #78 (closes Issue #74).

## Store Schema (v3)
```
donated: Record<townId, Record<gameId, Record<itemId, boolean>>>
donatedAt: Record<townId, Record<gameId, Record<itemId, string>>>
towns: Town[]  // Town: id, name, gameId, hemisphere ('NH'|'SH'), createdAt
```
CRITICAL: callers use `getActiveTown().gameId` to scope donations — store handles the 3rd level. `hemisphere` defaults to `'NH'`; only meaningful for ACNH (drives months_nh / months_sh).

## Multi-Game Support
- GameId = 'ACGCN' | 'ACWW' | 'ACCF' | 'ACNL' | 'ACNH'
- Data files use game-local IDs; the schema scopes by gameId.
- Game is **immutable post-create** (Decision 1). Only display games with data files in TownManager's create form.

## Scroll-to + highlight (Decision 10)
`ACCanvas` owns `highlightId`. Setters: HomeTab (via `useJumpToRow`) and `GlobalSearchDropdown.onJump` both `setTab + setHighlightId`. `CategoryTab` opens the matching row, scrolls (`block: 'center'`, smooth) on the next animation frame, and adds `.ac-row-pulse` (1.4s `@keyframes ac-row-pulse`). Rows stamp `data-row-id={item.id}`. The state clears after the pulse so re-jumping the same id retriggers.

## Dev Preview
https://development-animalcrossingwebapp.vercel.app/ — auto-deploys from `development` via Vercel GitHub integration. Never run `vercel` CLI manually.

## Reference Docs
- `docs/v0.9-plan.md` — canonical v0.9 implementation plan + locked decisions
- `docs/decisions.md` — reverse-chronological decision log
- `docs/design-handoffs/` — v0.9 / v0.9.1 / v0.9.2 design specs
- `docs/v0.7-audit.md` / `docs/v0.7-architecture-proposal.md` — multi-game foundation history
- `docs/dev-process.md` — full dev process
