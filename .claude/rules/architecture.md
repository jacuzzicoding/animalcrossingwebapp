# Architecture Reference (v0.7)

## Stack
Vite + React 19 + TypeScript + Tailwind CSS v4 + Zustand (persist middleware)

## Key Files
- `src/lib/store.ts` — Zustand store, persist v2, 3-level donation schema
- `src/lib/types.ts` — GameId union, Town, Game interface, GAMES registry
- `src/lib/constants.ts` — MONTH_NAMES, CATEGORY_LABELS, SEASONS (single source of truth)
- `src/lib/colors.ts` — design token hex constants
- `src/lib/storeMigrations.ts` — Zustand migrate callback (v1→v2, backfills gameId)
- `src/lib/bootstrapMigration.ts` — one-time localStorage key rename, called in main.tsx before createRoot
- `src/hooks/useHydration.ts` — onFinishHydration guard, prevents flash of empty state
- `src/components/ErrorBoundary.tsx` — wraps app root, crashes show ErrorState not blank page
- `src/ACCanvas.tsx` — ~1500 lines, SCHEDULED FOR DECOMPOSITION in v0.7 (see docs/v0.7-architecture-proposal.md)
- `public/data/<gameId>/` — item data files per game (acgcn/, acww/ exist; accf/, acnl/, acnh/ pending)

## Store Schema (v2)
```
donated: Record<townId, Record<gameId, Record<itemId, boolean>>>
donatedAt: Record<townId, Record<gameId, Record<itemId, string>>>
towns: Town[]  // each Town has id, name, playerName, gameId, createdAt
```
CRITICAL: callers use getActiveTown().gameId to scope donations — store handles the 3rd level.

## Multi-Game Support
- GameId = 'ACGCN' | 'ACWW' | 'ACCF' | 'ACNL' | 'ACNH'
- Data files use game-local IDs (sea-bass in ACGCN == sea-bass in ACWW — schema handles scoping)
- Only show games with data files present in CreateTownModal

## Dev Preview
https://development-animalcrossingwebapp.vercel.app/ — deploy with `vercel deploy` from development branch

## Reference Docs
- docs/v0.7-audit.md — full ranked audit (P0/P1/P2)
- docs/v0.7-architecture-proposal.md — approved design decisions
- docs/dev-process.md — full dev process (this is the .claude/rules/ version)
