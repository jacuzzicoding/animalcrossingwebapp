# Architecture Reference (v0.8.2)

Key architectural context for Claude Code sessions. See also `docs/v0.7-architecture-proposal.md`.

## Stack

- **Framework:** Vite + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 — utility classes only; design tokens are inline hex constants in `src/lib/colors.ts`
- **State:** Zustand ^5 with `persist` middleware (localStorage key: `ac-web`, schema version 2)
- **Tests:** Vitest
- **Hosting:** Vercel (auto-deploys from `main`)

## Store Schema (v2, as of v0.7)

Donation data uses a **3-level schema**:

```
donated[townId][gameId][itemId] = boolean
donatedAt[townId][gameId][itemId] = ISO timestamp
```

- `gameId` is a `GameId` union: `'ACGCN' | 'ACWW' | 'ACCF' | 'ACNL' | 'ACNH'`
- `Town` has a `gameId` field (backfilled to `'ACGCN'` for pre-v0.7 towns)
- Zustand `persist` is at `version: 2`; migrations in `src/lib/storeMigrations.ts`

## Migration Path

- `src/lib/bootstrapMigration.ts` — runs in `main.tsx` before React mounts; one-time localStorage key rename (`ac-web:v1` → `ac-web`)
- `src/lib/storeMigrations.ts` — Zustand `migrate()` callback: v1→v2 lifts flat schema to 3-level, backfills `gameId`
- Zero data loss for existing users

## Hydration Guard

- `src/hooks/useHydration.ts` — custom hook that resolves after `onFinishHydration`
- `App.tsx` renders a loading state until the store is rehydrated — eliminates empty-state flash for returning users

## ACCanvas.tsx

- Orchestration shell; mounts the active tab view, wires modals, and handles global search
- Do not add new top-level tabs without updating `VALID_TABS`, the tab-switch render, and `TabBar` props

## Categories

`CategoryId = 'fish' | 'bugs' | 'fossils' | 'art' | 'sea_creatures'` (added v0.8.2)

`CATEGORY_ORDER` and `AllData` both include `sea_creatures`. Sea creatures are loaded for ACNL and ACNH only (`GAMES_WITH_SEA_CREATURES` set in `categoryMeta.ts`); the tab is hidden for other games via data-length check.

## Data Files

Museum data lives in `public/data/<gameId>/`:
- `public/data/acgcn/` — Animal Crossing GCN (40 fish, 40 bugs, 25 fossils, 13 art)
- `public/data/acww/` — Animal Crossing Wild World (56 fish, 56 bugs, 52 fossils) — added v0.7
- `public/data/accf/` — City Folk (40 fish, 40 bugs, 52 fossils) — added v0.7
- `public/data/acnl/` — New Leaf (fish, bugs, fossils, art, sea creatures) — added v0.8
- `public/data/acnh/` — New Horizons (81 fish, 80 bugs, 86 fossils, 43 art, 40 sea creatures; NH/SH months) — added v0.8

Item IDs are shared across games where species overlap. The store scopes by `gameId`, so this is safe.

## Multi-Game Types

```ts
type GameId = 'ACGCN' | 'ACWW' | 'ACCF' | 'ACNL' | 'ACNH';

interface Game {
  id: GameId;
  name: string;
  shortName: string;
  year: number;
}

const GAMES: Record<GameId, Game> = { ... }; // in src/lib/types.ts
```

## Error Handling

- `src/components/ErrorBoundary.tsx` — top-level React error boundary in `App.tsx`; unhandled crashes render `ErrorState`
- `src/components/ErrorBanner.tsx` — dismissible inline error for soft failures
- `src/components/ErrorState.tsx` — full-page fallback for hard failures
- `AppErrorKind` discriminated union in `src/lib/types.ts`

## Design Tokens

Inline hex values via `src/lib/colors.ts` — **no Tailwind design tokens**:
- `#7B5E3B` — wood (header/section backgrounds)
- `#F5E9D4` — paper (card backgrounds)
- `#2A2A2A` — ink (primary text)
- `#3CA370` — leaf (progress bars, success states)
- `#E7DAC4` — border colour
- `#5a4a35` — secondary/muted text
- Google Fonts: **Varela Round**

## Constants

Shared constants in `src/lib/constants.ts`: `MONTH_NAMES`, `CATEGORY_LABELS`, `CATEGORY_ORDER`, `SEASONS`.
