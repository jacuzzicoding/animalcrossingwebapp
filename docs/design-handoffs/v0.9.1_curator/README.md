# Handoff: v0.9.1 UI Redesign — "Curator"

## What's new since v0.9

This bundle replaces the prior `design_handoff_v0.9_curator/` snapshot. Same overall direction (sidebar + sectioned list, Meadow palette, Fraunces+Inter type), but with three additions and one bugfix:

1. **Town Manager drawer** (`addons.jsx` → `TownManager`, `addons-styles.css`)
   - Right-side drawer (420px wide) with scrim. Replaces the old town-switcher dropdown + Create/Edit modals.
   - Row-level inline edit (name, game, hemisphere for ACNH). "+ New town" sticky CTA in the footer expands into the same form pattern.
   - Active town shows accent border + filled radio mark.
   - Mobile: collapses to a bottom sheet at ≤720px.
   - **Wiring:** Replaces `CreateTownModal`, `EditTownModal`, and the `TownSwitcher` dropdown. Reads/writes `towns` and `activeTownId` from the existing Zustand store.

2. **Sea Creatures tab** (already in v0.8.2 but visually styled here)
   - Sidebar shows the Sea entry only when `activeTown.gameId === "acnh" || "acnl"`.
   - Same row treatment as fish/bugs/fossils, with shadow size + time pill in the meta line.
   - Slotted between Art and Stats.

3. **Global Search dropdown** (`addons.jsx` → `GlobalSearchDropdown`)
   - Anchored under the search input on Home only (`tab === "home"`). Other tabs keep per-tab inline filtering.
   - Three states: empty (recent searches from `localStorage`), no-match, and grouped results.
   - Grouped by category with colored dot + count. Each row: monogram glyph (category-tinted), name, meta line (habitat / value), donated badge.
   - Keyboard nav: ↑↓ to move, ↵ to open, esc to close. Search history persisted to `ac-curator-search-history` (8 entries max).
   - **Wiring:** Replaces the existing `GlobalSearchBar` + `GlobalSearchResults` + `SearchHistoryPopover` trio. Selecting a result jumps to that category's tab.

4. **Bugfix: theme switching no longer tints all category icons green**
   - `theme.js` was writing `--chip-bug` and `--chip-fossil` (singular) but the CSS reads `--chip-bugs` and `--chip-fossils` (plural). Fixed all four themes.
   - Added `chipSea` token to every theme.

## File map

| File | Purpose |
|---|---|
| `Curator.html` | Entry point. Defaults, theme, and orchestration. |
| `shell.jsx` | Sidebar, ProgressMeter |
| `components.jsx` | Glyph, ItemRow, ExpandPanel, MonthStrip, MonthGrid, Pill, etc. |
| `tabs.jsx` | HomeTab, CategoryTab, StatsTab |
| `addons.jsx` | **NEW** — TownManager drawer + GlobalSearchDropdown |
| `data.js` | Mock data (fish/bugs/fossils/art/sea, towns, recent activity) |
| `theme.js` | 4 themes — Meadow (default), Parchment, Midnight, Sakura |
| `styles.css` | Core styles |
| `addons-styles.css` | **NEW** — drawer + dropdown styles |
| `tweaks-panel.jsx` | In-page Tweaks panel (skip in production) |

## Migration notes (delta from v0.9)

- `useMuseumData` already takes a `gameId` — no change. Continue gating Sea on `gameId in {acnl, acnh}`.
- The Town Manager drawer should mount at the **layout level** (above the router), not inside `ACCanvas`. This unblocks the v0.8.1 stopgap where Edit/Create buttons were greyed out on category tabs.
- `GlobalSearchDropdown` should hook into the existing `useSearch` hook for debounce + history. Replace `SearchHistoryPopover` entirely; recent-search rendering moves into the dropdown's empty state.
- All existing route paths preserved.

## Themes

Default: **Meadow**. Other three are progressive enhancement.

| token | meadow | parchment |
|---|---|---|
| `accent` | `oklch(0.55 0.09 150)` (moss) | `#3CA370` (leaf) |
| `chip-fish` | `oklch(0.62 0.08 230)` | `#3F6FA8` |
| `chip-bugs` | `oklch(0.6 0.1 130)` | `#7B9C3A` |
| `chip-fossils` | `oklch(0.55 0.06 60)` | `#7B5E3B` |
| `chip-art` | `oklch(0.58 0.08 320)` | `#8B5E94` |
| `chip-sea` | `oklch(0.58 0.09 200)` | `#3D8B96` |

Category chip colors are **identity tokens** — they should remain consistent across all themes. Only `accent`, `bg`, `surface`, and `ink` shift between themes.

## Fonts

- Display: **Fraunces** (500/italic) — headers, titles, hero, monogram glyphs
- UI: **Inter** (400/500/600) — everything else
- Parchment theme overrides both to **Varela Round** to match the existing app

## See also

The v0.9 README in `design_handoff_v0.9_curator/README.md` has the full screen-by-screen spec — layouts, spacing, interaction notes. This bundle's components are the same shape; treat the v0.9 README as the canonical spec and this one as the diff.
