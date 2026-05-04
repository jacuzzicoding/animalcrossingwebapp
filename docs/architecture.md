# Architecture Reference (v0.9.1-beta)

This document mirrors `.claude/rules/architecture.md` — the canonical copy that Claude Code sessions auto-load. They are kept in lockstep; if they diverge, the `.claude/rules/` copy wins. Update both together.

For the full reference (stack, key files, store schema, scroll-to + highlight wiring, multi-game support), see [`.claude/rules/architecture.md`](../.claude/rules/architecture.md).

## Quick reference

- **Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Zustand + React Router v6
- **Design:** Meadow tokens (CSS custom properties in `src/index.css` `@theme`), Fraunces + Inter (Varela Round retired in Phase 1)
- **State:** persisted `useAppStore` (key `ac-web`, schema v3) + non-persisted `useUIStore` (TownManager open flags)
- **Layout:** `Sidebar` (280px, sticky) + main column. `TownManager` drawer mounts at App level. `MuseumHeader` / `TabBar` / `TownSwitcher` retired in Phase 2.
- **Highlight:** `ACCanvas` owns `highlightId`; HomeTab + `GlobalSearchDropdown` call `jumpTo(category, id)` (via `useJumpToRow`) and `CategoryTab` scrolls + pulses the matching row.
- **Settings:** `/settings` route — About + Danger zone only (no Appearance per Decision 3).

## Reference docs

- `docs/v0.9-plan.md` — canonical v0.9.0-beta plan + 10 locked decisions
- `docs/decisions.md` — reverse-chronological decision log
- `docs/design-handoffs/` — v0.9 / v0.9.1 / v0.9.2 design specs
- `docs/dev-process.md` — full dev process
- `docs/v0.7-audit.md` / `v0.7-architecture-proposal.md` — multi-game foundation history
