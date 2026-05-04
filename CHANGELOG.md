# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Changed — v0.9.1: data-driven icon gate (replaces allowlist)
- **`useGameHasIcons(gameId)`** — replaces the `GAMES_WITH_ICONS = { ACGCN }` allowlist with a data-driven probe of `/icons/<gameId>/manifest.json`. State is tri-valued (`unknown` / `present` / `absent`), cached at module scope, fetched lazily on first call per game. Same lesson as the v0.9 `GAMES_WITH_ART` cleanup: data-driven gates beat per-game capability sets, because future v0.9.x icon releases now light up automatically the moment their `manifest.json` is committed — zero code changes.
- **`isUsableManifest()`** — schema check rejects malformed JSON (non-object, no recognised category keys, all categories empty) so a corrupt deploy doesn't render `<ItemIcon>` against a busted manifest.
- **Tests in `ItemIcon.test.tsx`** — added 4 hook tests for `unknown` (in-flight returns false), `unknown → present` (200), `unknown → absent` (404), and `unknown → absent` (malformed JSON).

### Added — v0.9.1: ItemIcon component + UI wiring (PR (b) of icon track)
- **`src/components/ItemIcon.tsx`** — shared item icon component. Resolves `(gameId, category, id)` to `/icons/<gameId>/<category>/<filename>` via a per-game `manifest.json` loaded lazily and cached at module scope. Reserves `size × size` before the image loads to prevent layout shift; falls back to a tinted-monogram placeholder when the manifest entry is missing or the `<img>` errors.
- **`src/components/itemIconUtils.ts`** — manifest cache, fetch, subscribe/notify, and the `gameHasIcons(gameId)` gate. `GAMES_WITH_ICONS` is currently `{ ACGCN }`; other games render the existing textual-glyph fallback until their respective icon scrapes ship.
- **`scripts/generate-icon-manifest.ts`** — standalone manifest re-emitter (`npm run icons:manifest`). Walks `public/icons/<gameId>/` and writes the same `{ category: { id: filename } }` shape `fetch-icons.ts` produces, in catalog order.
- **`<ItemIcon>` slotted into four surfaces** — 32×32 in `CollectibleRow`, 64×64 in `ItemExpandPanel` (top-left, hidden ≤720px), 24×24 in `GlobalSearchDropdown` results, 24×24 in `HomeTab` shelf cards and recent-activity rows. Each surface keeps its prior glyph as the fallback for non-ACGCN games.
- **`CategoryTab`, `CollectibleRow`, `ItemExpandPanel`** gain a `gameId` prop forwarded from `ACCanvas` so the icon resolver can scope to the active town's game.
- **`src/components/ItemIcon.test.tsx`** — 5 tests covering URL construction, missing-entry fallback, fetch-failure fallback, runtime `<img>` error fallback, and dimension reservation before load.
- **`src/index.css`** — appended `.ac-expand { position: relative; }`, `.ac-expand-icon` (top-left absolute, hidden ≤720px), and inline-block layout helpers for the icon wrappers in row/search/home contexts.

## [v0.9.0-beta] — 2026-05-04

### Fixed — Version footer suppresses `release/` branch suffix (#60)
- **`src/App.tsx`** version footer now hides the `· <branch>` suffix when the active branch starts with `release/`. Production hostname behavior unchanged. Closes #60.

### Changed — Art tab uses inline ItemExpandPanel (#81)
- **Art tab converted from `DetailModal` bottom-sheet to inline `ItemExpandPanel`.** Art rows now expand inline like fish/bugs/fossils/sea creatures — same `.ac-row` → `.ac-expand` flow. Closes #81 (v0.9 release blocker).
- **`ItemExpandPanel`** surfaces art-specific fields: `basedOn` (real-world artwork + artist) as the primary stat, plus a Crazy Redd authentication note keyed off `hasFake` (counterfeit-possible vs. always-genuine). Hidden when `hasFake` is undefined (ACGCN/ACWW/ACCF/ACNL data).
- **`ArtPiece` type** gains optional `hasFake?: boolean` (ACNH-only, sourced from existing `acnh/art.json`).
- **`DetailModal` retired** — file deleted. It was the only remaining consumer; global search jumps via `onJump` (highlight + scroll), and no other tab uses it. `CategoryTab` drops the `onItemSelect` prop and the `category === 'art'` special-cases. `ACCanvas` drops the `selected` state.
- **CSS:** `.ac-art-fake-note` (warn / ok variants reusing existing `--warn` / `--accent` tokens) and `.ac-stat-art` italic basedOn rendering, appended to `src/index.css`.

### Added — Phase 10: Mobile responsive polish
- **Mobile breakpoint hierarchy** documented (`980 / 720 / 700 / 480`). Surgical CSS additions to `src/index.css` Phase 10 block address touch targets and overflow at iPhone SE (375px) through iPad portrait (768px).
- **Touch targets ≥44px** at ≤720px: `.ac-tm-close`, `.ac-settings-close`, `.ac-tm-row-edit`, `.ac-tm-ghost / -primary / -danger`, `.ac-gs-history-row`, `.ac-gs-row`, `.ac-donate-btn`, `.ac-chevron`. Hemisphere toggle and segmented controls bumped to comfortable tap sizes.
- **iOS zoom prevention** — `.ac-search input` rendered at `font-size: 16px` on stacked layouts so Safari does not auto-zoom on focus.
- **Hero / category title overflow** — `word-break: break-word` on `.ac-hero-headline` and `.ac-category-title`; further font shrink at ≤480px (hero 26px, category 28px, settings 32px).
- **Recent activity row** at ≤720px — category label hidden so item name + relative time fit on one line at 360–390px.
- **Topbar wraps** at ≤480px so the search input stays full-width on narrow viewports.
- **Sidebar foot links** get full 44px tap height when the sidebar stacks above main at ≤980px.
- **Kbd hint footer** in `GlobalSearchDropdown` hidden at ≤720px (no hardware keyboard assumed). Tap-to-select via existing `onClick` handlers verified.

### Verified — Phase 10
- Sidebar stacks above main at ≤980px (not hidden); ProgressMeter `.ac-meter-5` wraps to 2 rows; TownManager renders as bottom sheet at ≤720px; Settings collapses + danger buttons go full-width at ≤700px; scroll-to + `.ac-row-pulse` highlight is viewport-agnostic.

### Added — Phase 9: StatsTab
- **`StatsTab` component** (`src/components/StatsTab.tsx`) — replaces `AnalyticsView`. Renders per-category cards (3/4/5 cards, gated by game: fish/bugs/fossils always; art for ACGCN/ACNL/ACNH; sea for ACNL/ACNH) above a 12-column "Yearly rhythm" availability chart. Each card shows category eyebrow tinted with the matching `--chip-*` token, donated/total in Fraunces 32, a thin tinted progress bar, and "X% complete" caption.
- **Yearly rhythm chart** — 12 stacked columns. Background bar height = `avail / maxAvail`; inner accent fill = `donated / avail`. Number above each column = items available that month. Current month column borders in `--accent`. Includes fish + bugs always; sea creatures added for ACNL/ACNH (Decision 4). Hemisphere-aware via `itemMonths(item, cat, hemisphere)`. Legend below: "Available" / "Already donated".
- **Phase 9 CSS** appended to `src/index.css` — `.ac-stats`, `.ac-stats-grid` (responsive 3/4/5 → 2 → 1 columns at 980px / 480px), `.ac-statcard` / `-cat` / `-num` / `-of` / `-bar` / `-fill` / `-pct`, `.ac-chartcard`, `.ac-chart` / `-col` / `-bar` / `-bar-bg` / `-bar-fill` / `-num` / `-month`, `.ac-chart-legend` / `-dot` / `-dot-bg` / `-dot-fill`. Current-month column gets accent border via `.ac-chart-col.is-now`.

### Removed — Phase 9
- **`AnalyticsView`** (`src/components/views/AnalyticsView.tsx`) — superseded by `StatsTab`.
- **`SectionCard`** (`src/components/views/SectionCard.tsx`) — its only consumer was `AnalyticsView`; new card primitives are inline.

### Decisions — Phase 9
- **Sea creatures included in the chart for ACNL/ACNH.** Per Decision 4, sea is a first-class category in nav/ProgressMeter/HomeTab/Search, so excluding it from the yearly rhythm would be inconsistent. ACGCN/ACWW/ACCF still chart only fish + bugs (no sea data exists for those games).
- **3-letter month labels** (`Jan`/`Feb`/…) instead of the 1-letter mocks in the handoff — readable at the production sidebar layout width and at the 980px breakpoint.
- **Card-count attribute drives grid sizing only.** The component derives the actual list of cards from `gameId` data presence (mirroring `getDataPaths`); `data-card-count` on the grid is set from `cards.length` purely so CSS can pick the right column template.

### Added — Art data for ACWW + ACCF
- **`public/data/acww/art.json`** — 20 paintings sourced from Wikibooks (`Animal_Crossing:_Wild_World/Paintings`). Schema matches `acnl/art.json` (`id`, `name`, `basedOn`).
- **`public/data/accf/art.json`** — 23 paintings. City Folk adds 7 over Wild World (dynamic, jolly, moody, proper, scenic, serene, wistful) and drops 4 (dainty, lovely, opulent, rare). `basedOn` strings reuse ACNL phrasing verbatim wherever the real-world reference matches, so cross-game search stays consistent.
- **Loader fix** (`src/lib/categoryMeta.ts`) — added `'ACWW'` and `'ACCF'` to `GAMES_WITH_ART` so `getDataPaths()` actually fetches the new files. Sidebar's `data.art.length > 0` gate then lights up the tab. Includes corresponding 4-card StatsTab grid (fish/bugs/fossils/art) for both games.
- Closes #74.

### Added — Phase 8: GlobalSearchDropdown
- **`GlobalSearchDropdown` component** (`src/components/search/GlobalSearchDropdown.tsx`) — unified search dropdown anchored under a topbar input on the Home tab. Four states: empty + intro hint, empty + recent searches (history), no-match for query, and grouped category results. Shows up to 5 items per group, max 5 groups (fish, bugs, fossils, art, sea). Sea group gated on `gameId ∈ {ACNL, ACNH}` and non-empty data. Art search matches both `name` and `basedOn` (Decision 8 — "Leonardo" → Famous Painting). Each row shows category-tinted monogram glyph, name with `donated` badge, and meta line (habitat / location / part / basedOn / shadow + bells).
- **Keyboard navigation** — `↑↓` move the active row, `↵` selects + jumps + closes, `Esc` closes the panel. Hovering a row also sets the active index.
- **Search history** — persists in `localStorage` under `ac-curator-search-history`, max 8 entries, deduplicated, most recent first. Stored on result selection. "Clear" button in the history header empties it.
- **Result jump wiring** — selecting a result calls `onJump(category, id)`, which sets the active tab via React Router and stamps `highlightId` so `CategoryTab`'s scroll-to + `.ac-row-pulse` animation fires (Decision 10). Identical pattern to Phase 6 home shelves.
- **Phase 8 CSS** appended to `src/index.css` — `.ac-topbar`, `.ac-search-wrap`, `.ac-search` (rounded pill input with focus ring), `.ac-gs-panel`, `.ac-gs-empty` / `-title` / `-sub` / `-hint`, `.ac-gs-section-head` / `.ac-gs-eyebrow` / `.ac-gs-clear`, `.ac-gs-history` / `-row` / `-icon`, `.ac-gs-group` / `-head` / `-dot` / `-count`, `.ac-gs-row` / `-active` / `-glyph` / `-text` / `-name` / `-donated` / `-meta` / `-arrow`, `.ac-gs-foot` + `kbd` chip styling.

### Removed — Phase 8
- **`GlobalSearchBar`, `GlobalSearchResults`, `SearchHistoryPopover`** — deleted (`src/components/search/`). Replaced wholesale by `GlobalSearchDropdown`.
- **`useSearch` hook** — deleted (`src/hooks/useSearch.ts`). Search state now lives inside `GlobalSearchDropdown`.
- **`'search'` view route** — removed from `ViewId`, `VALID_TABS`, and the Sidebar nav. The retired Search tab is replaced by the dropdown on Home.

### Decisions — Phase 8
- **Topbar lives only on Home tab.** Per the v0.9.2 spec, other tabs keep their per-tab inline search inside `CategoryTab`. Mounting the topbar on Home only avoids two competing search affordances on category pages.
- **Click-outside dismisses the panel; result clicks use `onMouseDown` preventDefault.** Without `preventDefault` on mousedown, the input would lose focus before the click handler fired and the dropdown would close mid-click.
- **Sea group gated on both game and data presence.** Mirrors the gating in Sidebar nav and ProgressMeter — a town whose game JSON happens to be missing sea data still renders correctly without an empty section.
- **Per-group limit kept at 5.** Matches the v0.9.2 design and keeps the dropdown short enough to scan without scrolling on a 1080p viewport even when all 5 groups have hits.

### Added — Phase 7: CategoryTab sectioning
- **`CategoryTab` component** (`src/components/CategoryTab.tsx`) — replaces the inline category render in `ACCanvas`. Groups items into four sections (Leaving this month / Available now / Out of season / Already donated), each with an eyebrow header and item count. Empty groups are hidden. December→January wrap is handled via `next = currentMonth === 12 ? 1 : currentMonth + 1`. Donated items always land in "Already donated" regardless of season. Categories without month data (fossils, art) treat all non-donated items as "Available now". Owns its own `expandedId` state — only one row open at a time per tab — and reacts to `highlightId` by opening the matching row before ACCanvas's scroll-to fires.
- **Category page header** — Fraunces 44 `<em>{donated}</em> of {total} {category}` title and right-aligned meta line ("X% complete" + "Showing availability for {month}" for seasonal categories). Stats card-style header sits above the per-tab search bar.
- **Phase 7 CSS** appended to `src/index.css` (`.ac-category`, `.ac-category-head`, `.ac-category-title`, `.ac-category-meta`, `.ac-group`, `.ac-group-head`, `.ac-group-title`, `.ac-group-count`, plus `.ac-group-warn` / `.ac-group-accent` / `.ac-group-muted` / `.ac-group-done` tone modifiers). Header collapses to single column ≤700px and the category title shrinks to 32px.

### Removed — Phase 7
- Inline category render in `ACCanvas` (`CategoryProgress` import + flat `.ac-list` map). The progress display moves into the new category header. `CategoryProgress` itself remains in the codebase for now and is slated for removal during the Phase 9 stats rebuild per the v0.9 retirement list.

### Decisions — Phase 7
- **Section ordering is fixed and ungrouped categories collapse cleanly.** Fossils and art have no month data, so for those tabs only the "Available now" and "Already donated" groups can ever appear. The ordering still reads naturally; we don't special-case the layout for non-seasonal categories.
- **Per-tab search lives inside CategoryTab, not above it.** Keeping the search bar inside the new component lets the section grouping recompute on filter without re-flowing the page header. The header always shows totals for the full category, not the filtered subset, so users can see overall progress while narrowing the list.
- **Art keeps its bottom-sheet `DetailModal`.** The plan's "row click toggles inline expand" rule applies to fish/bugs/fossils; art was already on a different pattern in v0.8 and the v0.9 design preserves that. CategoryTab routes art clicks to the existing `onItemSelect` callback in `ACCanvas` and renders no inline panel for that category.
- **`ItemExpandPanel` is rendered as a sibling of `CollectibleRow` inside the same `.ac-list`.** This preserves the existing CSS that ties `.ac-row` divider + `.ac-row-pulse` keyframe to the row container without restructuring the row primitive (locked from Phase 5).

### Added — Phase 6: HomeTab + ProgressMeter
- **`ProgressMeter` component** (`src/components/ProgressMeter.tsx`) — segmented donation progress bar. 4 segments (fish/bugs/fossils/art) for ACGCN/ACWW/ACCF; 5 segments (adds sea) for ACNL/ACNH. Each segment uses its category-tinted Meadow chip token (`--chip-fish`/`--chip-bugs`/`--chip-fossils`/`--chip-art`/`--chip-sea`) and exposes a per-segment aria-label like "Fish: 12 of 40 donated". Pure helper `segmentsForGame` extracted to `src/components/progressMeterUtils.ts` and unit-tested.
- **`HomeTab` rebuilt** (`src/components/HomeTab.tsx`) — new structure per v0.9 design: hero stat with italic Fraunces accent number ("X creatures still to donate this month"), warn-italic aside ("N leaving soon"), `ProgressMeter` directly underneath, 12-cell month strip with current-month highlight, "Leaving end of {month}" warn-toned shelf, "Just arrived" accent-toned shelf, and a "Latest donations" card. Sea creatures included in shelves and progress for ACNL/ACNH towns. Each shelf card / latest-donations row click fires `jumpTo(category, id)` which sets the active tab and `highlightId` so the matching row scrolls into view and pulses (Decision 10). Hero falls back to "X of Y donated" when the active game has no seasonal categories.
- **`useJumpToRow` hook** (`src/hooks/useJumpToRow.ts`) — reusable navigation helper. Pushes `/town/:townId/:tab` and sets `highlightId` on the next animation frame; ACCanvas's existing scroll-to-and-pulse effect picks up the change. Will also be wired into `GlobalSearchDropdown` in Phase 8.
- **Phase 6 CSS** appended to `src/index.css` (`.ac-meter` / `.ac-meter-seg` / `.ac-meter-track` / `.ac-meter-fill` + `.ac-meter-5` responsive modifier, `.ac-home`, `.ac-hero` + `.ac-hero-headline` / `.ac-hero-aside`, `.ac-eyebrow` + `.ac-eyebrow-warn` / `.ac-eyebrow-accent`, `.ac-month-strip` / `.ac-month-cell`, `.ac-shelf-head` / `.ac-shelf-title` / `.ac-shelf-grid` / `.ac-shelf-card` / `.ac-shelf-glyph`, `.ac-month-dots`, `.ac-recent-card` / `.ac-recent-row`). 5-segment ProgressMeter drops fractions between 980-1180px and wraps to 2 rows ≤980px.

### Decisions — Phase 6
- **Seasonal UI gated on at least one seasonal category having data.** Fish + bugs always seasonal; sea creatures added to the list only for ACNL/ACNH where we ship hemisphere-aware month data. ACGCN/ACWW/ACCF still get the seasonal UI (fish + bugs).
- **`ProgressMeter` lives on the HomeTab hero, not the sidebar.** The plan allows either; placing it directly under the hero stat keeps the bar near the headline number it relates to and avoids crowding the sidebar's nav counts (which already give per-category progress).
- **Hero copy adapts to game.** When there are no seasonal categories with data the hero falls back to "{donated} of {total} donated." rather than showing a "0 creatures still to donate" line that would read as empty-state success when it's actually a coverage gap.
- **Shelves cap at 6 items per shelf.** A horizontal-scroll variant was considered but the v0.9 design uses a 3-column grid; we keep the same grid and slice to a sensible number to avoid an unbounded vertical wall on towns with many in-season items.
- **`jumpTo` clears `highlightId` to null before re-setting on the next frame.** Without the clear, jumping to a row that's already the highlight target wouldn't retrigger the pulse — the effect dependency is the id and React would batch a same-id setter into a no-op.

### Added — Phase 1: tokens + fonts
- **Meadow design tokens** — full palette added to `src/index.css` `@theme` block as CSS custom properties (`--bg`, `--surface`, `--surface-alt`, `--ink`, `--ink-soft`, `--ink-muted`, `--border`, `--border-strong`, `--accent`, `--accent-soft`, `--accent-ink`, `--warn`, `--warn-soft`, `--chip-fish`, `--chip-bugs`, `--chip-fossils`, `--chip-art`, `--chip-sea`). Mirrored in `src/lib/colors.ts` as the new `meadow` export.
- **Fraunces** (variable, opsz 9..144, weights 400/500/600 + italic 400/500) and **Inter** (400/500/600/700) loaded via Google Fonts in `index.html` and `src/index.css`. Registered as `--font-display` and `--font-sans` in `@theme`. New `fontStacks` export in `src/lib/colors.ts`.

### Removed — Phase 1
- **Varela Round** — fully retired. `@import` removed from `src/index.css`, `index.html`, and `public/version-history.html`. Inline `fontFamily: 'Varela Round, ...'` reference in `src/App.tsx` loading state replaced with Inter. Per locked decision #2 in `docs/v0.9-plan.md`, Fraunces + Inter is the sole type stack.

### Notes
- This phase is plumbing only. No components consume the new tokens yet; visual output is intentionally near-identical to v0.8.2-alpha. Component restyles begin in Phase 5.
- **Parchment, Midnight, and Sakura themes are intentionally excluded** per locked decision #2 in `docs/v0.9-plan.md` ("ship Meadow only"). The legacy `colors` export in `src/lib/colors.ts` is kept untouched until later phases retire its consumers.

### Added — Phase 2: sidebar + shell layout
- **`Sidebar` component** (`src/components/Sidebar.tsx`) — 280px sticky left sidebar with brand mark/wordmark, active-town card, vertical nav with per-category `donated/total` counts, and Export CSV / Settings footer. Uses `<NavLink>` so active state tracks the URL.
- **App shell layout** in `src/index.css` (`.ac-app`, `.ac-sidebar`, `.ac-main`, `.ac-nav-*`, `.ac-town-*`, `.ac-brand-*`, `.ac-foot-link`, `.ac-hem-toggle`, `.ac-hem-btn`) — CSS grid `280px 1fr`, max-width 1440px centered. Below 980px sidebar stacks above main (CSS grid row change).
- Sea nav entry gated on `gameId in {ACNL, ACNH}` and presence of sea data; Art nav entry hidden when game has no art.
- Hemisphere toggle (NH/SH) inline in the sidebar town card for ACNH towns — preserves the toggle that previously lived in `MuseumHeader`. Will move into `TownManager` in Phase 4.
- Settings nav button routes to `/settings` (route lands in Phase 3).

### Removed — Phase 2
- **`MuseumHeader`**, **`TabBar`**, **`TownSwitcher`** — deleted. Replaced by `Sidebar`. ACCanvas no longer renders the wood-toned header bar or horizontal tab strip; main column now sits inside `.ac-main`.

### Decisions — Phase 2
- The plan calls the Active Town card's "Switch town ›" button a Phase 4 stub. Implemented as a temporary lightweight switcher: 0 other towns → opens `CreateTownModal`; 1 other → activates it; 2+ → `window.prompt` picker. Replaced wholesale by `TownManager` in Phase 4.
- Edit / New town are exposed as small links inside the active-town card so users don't lose town CRUD between Phase 2 and Phase 4 (they previously lived in the now-deleted `TownSwitcher`). Both still wire to the existing `EditTownModal` / `CreateTownModal`, which Phase 4 will retire.
- Hemisphere toggle relocated to the sidebar town card to avoid regressing the v0.8 functionality that lived in `MuseumHeader`. Phase 4 moves it into `TownManager`.
- Brand wordmark uses **"Museum Tracker"** (matching the prior MuseumHeader) — not "Curator", per the codename note in `docs/v0.9-plan.md` (no user-facing copy says "Curator").

### Added — Phase 3: settings page
- **`SettingsPage` component** (`src/components/SettingsPage.tsx`) — full-page settings route with two sections: **About** (version, source link, live storage summary, credits) and **Danger zone** (reset donations for active town, reset everything). No Appearance section per locked decision #3.
- **`SettingsRoute` wrapper** (`src/components/SettingsRoute.tsx`) — renders the Sidebar + SettingsPage in the same shell layout as `ACCanvas`, so the sidebar (active town, nav, footer) stays in place when at `/settings`.
- **`/settings` route** added to `App.tsx`. Sidebar Settings link now navigates to it; Esc and the close button navigate back to `/town/:id/home` (or `/` if there's no active town).
- **Store reset actions** in `src/lib/store.ts`: `resetActiveTownDonations()` clears `donated` and `donatedAt` for the active town only; `resetAll()` empties towns + donations + clears `ac-curator-search-history` from localStorage. Both are gated behind native `confirm()` per locked decision #7.
- **Settings page styles** in `src/index.css` (`.ac-settings`, `.ac-settings-head`, `.ac-settings-eyebrow`, `.ac-settings-title`, `.ac-settings-close`, `.ac-settings-section`, `.ac-settings-card`, `.ac-about-list`, `.ac-settings-danger`, `.ac-danger-row`, `.ac-danger-btn`, `.ac-danger-btn-strong`, `ac-fade-up` keyframe). Responsive collapse at ≤700px (title 56→40px, About list single-column, Danger rows stack with full-width buttons).

### Decisions — Phase 3
- **No Appearance section** — locked decision #3. Meadow is the only theme in v0.9, so a one-card theme switcher would feel hollow. Brought back when there are real alternatives.
- **Eyebrow text on Settings header** is "Museum Tracker" rather than "Curator" — matches the brand-wordmark decision from Phase 2 (the codename note in `docs/v0.9-plan.md`).
- **Reset donations is disabled** when there's no active town, instead of being hidden — keeps the Danger zone shape stable across states.
- **Settings is a top-level route** (`/settings`) rather than nested under `/town/:townId/settings`. The settings page is a property of the app, not the town — and a user mid-reset-everything wouldn't have an active town to nest under.

### Added — Phase 5: CollectibleRow + ItemExpandPanel restyle
- **`CollectibleRow`** (`src/components/CollectibleRow.tsx`) — rebuilt to match the v0.9 design. Replaces icon tile with a category-tinted **monogram glyph** (32×32, 1.5px border, Fraunces initials). Donated state fills the glyph with the chip color and inverts text. Donated rows strike through the name and add a `●` accent checkmark. Meta line uses `·` separators with category-specific bits (habitat for fish, part for fossils, shadow for sea, italic `basedOn` for art) and a tabular bells value. Renders `Leaving soon` (warn pill) or `New this month` (accent pill) per current-month wrap logic, plus an active-hours pill for sea creatures and an animated chevron. Stamps `data-row-id={item.id}` so jump-to logic can locate it. Accepts new `highlighted`, `currentMonth`, `hemisphere` props.
- **`ItemExpandPanel`** (`src/components/ItemExpandPanel.tsx`) — rebuilt as a two-column grid (`1fr 240px`, padded so the left column aligns with the row text after the glyph). Left column is the 12-cell `MonthGrid` with current-month highlight; right column stacks `bells · sell value`, optional `shadow size` and `active hours`, optional notes block, and the donate / undonate button at the bottom. Donate now lives only inside the panel — the row no longer shows a separate `DonateToggle`.
- **`MonthGrid`** (`src/components/shared/MonthGrid.tsx`) — re-skinned to use `.ac-monthgrid` / `.ac-monthcell` (12-column grid, square cells, accent-soft fill for available months, inset accent ring for the current month). Now accepts a `current` prop.
- **Scroll-to + highlight wiring** — `ACCanvas` owns `highlightId` state plus an effect that, on change, expands the matching row, schedules a `scrollIntoView({ behavior: 'smooth', block: 'center' })` on the next animation frame, and clears the state after the 1.4s pulse so re-jumping retriggers the effect (Decision 10). Phase 6 (`HomeTab` shelves) and Phase 8 (`GlobalSearchDropdown`) wire callers to the setter; the state shell is in place.
- **Phase 5 CSS** appended to `src/index.css`: `.ac-row`, `.ac-row-main`, `.ac-row-expanded`, `.ac-row-donated`, `.ac-row-pulse` + `@keyframes ac-row-pulse`, `.ac-glyph`, `.ac-row-text`, `.ac-row-name`, `.ac-row-checkmark`, `.ac-row-meta`, `.ac-row-meta-bit`, `.ac-row-meta-italic`, `.ac-row-meta-bells`, `.ac-row-side`, `.ac-row-time`, `.ac-chevron`, `.ac-pill` + `.ac-pill-warn` / `.ac-pill-accent`, `.ac-expand`, `.ac-expand-section`, `.ac-expand-label`, `.ac-monthgrid`, `.ac-monthcell` + states, `.ac-expand-side`, `.ac-stat`, `.ac-stat-num`, `.ac-stat-num-text`, `.ac-stat-label`, `.ac-note`, `.ac-donate-btn` + `.ac-donate-btn-on`, plus a 980px breakpoint that collapses the expand panel to a single column.
- Category list now wraps rows in a single `.ac-list` card (one rounded surface with internal dividers) instead of free-floating bordered rows.

### Decisions — Phase 5
- **`highlightId` state lives in `ACCanvas`, not `App`.** The plan/spec says "App owns highlightId," but `HomeTab`, the search results, and the category lists are all rendered inside `ACCanvas` and there is no Phase 5 caller above it. Keeping the state in `ACCanvas` keeps the wiring local; promoting it to `App` is cheap and can happen in Phase 6/8 if a caller above the router outlet ever needs it.
- **Donate / undonate is panel-only.** The design's row no longer has its own donate button — toggling moves into the expand panel, matching the v0.9.2 mockup. The row's `onToggle` prop is kept (optional) for back-compat with `GlobalSearchResults`, which Phase 8 will replace.
- **Time pill is sea-only.** The design's `item.time` field exists on sea creatures in our schema (Fish/Bug have `hours: number[]`, not a formatted string). Wiring fish/bug time displays would need a formatter — out of scope for Phase 5; revisit alongside `hours` rendering in v0.9.x.
- **Shadow size shown for sea creatures only**, not fish — our `Fish` type has no `shadow` field, so issue #59 (display shadow size) is partially addressed for sea creatures via the new stats stack but does not change fish rendering. Issue stays open for fish-specific shadow data work.

### Added — Phase 4: TownManager drawer
- **`TownManager` component** (`src/components/TownManager.tsx`) — right-side drawer (420px) that mounts at the layout level in `App.tsx`, so it overlays every route (home, category tabs, settings) without z-index or `overflow-hidden` issues. Below 720px it renders as a bottom sheet. Contains: the list of towns with active-town indicator, inline row edit (name + hemisphere only), a `+ New town` form (name + game + hemisphere), and per-row delete with native `confirm()` guard.
- **`useUIStore`** (`src/lib/uiStore.ts`) — small non-persisted Zustand store for transient UI state (`townManagerOpen`, `townManagerForceCreate`). Exposes `openTownManager(forceCreate?)` and `closeTownManager()`.
- **Auto-open in create mode when no towns exist** — `App.tsx` opens the TownManager forced-create when `towns.length === 0`. The drawer hides its close button, ignores Esc, and ignores scrim clicks in this state — equivalent to the previous "required" behavior on `CreateTownModal`.
- **`GAME_LIST`** export in `src/lib/types.ts` — ordered array of `Game`, used by the create-town form's game selector.
- **TownManager styles** in `src/index.css` (`.ac-tm-scrim`, `.ac-tm-drawer`, `.ac-tm-row*`, `.ac-tm-form`, `.ac-tm-seg`, `.ac-tm-cta`, `.ac-tm-newform`, `.ac-tm-empty`, `ac-fade` / `ac-slide` / `ac-slide-up` keyframes). Bottom-sheet variant at `(max-width: 720px)`.

### Changed — Phase 4
- **`Sidebar`** — the Phase 2 bridge stubs are removed: the `window.prompt` switcher, the Edit / + New buttons inside the active-town card, and the inline NH/SH segmented toggle. The single `Switch town ›` button now opens the TownManager. Hemisphere is shown as a read-only `Hem. NH` / `Hem. SH` label (editing happens in the drawer). Sidebar no longer takes `onOpenCreateTown` / `onOpenEditTown` props.
- **`useAppStore.createTown`** signature is `(name, gameId, hemisphere?)` — `playerName` removed. **`useAppStore.updateTown`** signature is `(id, patch: TownPatch)` where `TownPatch` is `{ name?, hemisphere? }`. `gameId` is intentionally not part of the patch (Decision 1 — game is immutable post-create).
- **`Town` type** — `playerName: string` field removed (Decision 5). Existing values in localStorage are silently dropped on next write; no migration step required.
- **`downloadCSV` / `buildCSV`** no longer take a `playerName` argument; the "Player" row is removed from CSV exports.

### Removed — Phase 4
- **`CreateTownModal`** (`src/components/modals/CreateTownModal.tsx`) — replaced by TownManager's New Town form.
- **`EditTownModal`** (`src/components/modals/EditTownModal.tsx`) — replaced by TownManager's inline row edit.
- **`TownNameFields`** (`src/components/shared/TownNameFields.tsx`) — no remaining consumers.
- **v0.8.1 greyed-out-buttons stopgap** — no longer needed; the TownManager drawer mounts at the layout level and works on every route, resolving the issue the stopgap worked around.

### Decisions — Phase 4
- **Decision 1 honored** — the inline edit form has no game `<select>`. The game is shown as a read-only badge with the hint "Game can't be changed after creation." `handleSave` builds a patch object that contains only `name` and `hemisphere`, never `gameId`.
- **Decision 5 honored** — `playerName` removed from `Town`, store, CSV export, and tests. No migration callback because Zustand's `persist` simply ignores fields not in the schema.
- **Hemisphere persistence** — the store keeps `hemisphere: Hemisphere` (`'NH'` | `'SH'`, default `'NH'`). The drawer passes `null` from the patch when the game isn't ACNH; `updateTown` ignores nulls so a town's stored hemisphere never gets clobbered.
- **TownManager state lives in a separate `useUIStore`** rather than inside `useAppStore`, so the drawer's open/closed state isn't persisted to localStorage across reloads.
- **Auto-open path replaces the `required` flag** — `CreateTownModal`'s `required={noTowns}` pattern is replaced by `App.tsx` opening the drawer in `forceCreate` mode whenever the store hydrates with zero towns. Same UX (modal-like, can't be dismissed) implemented as a single behavior gate inside the new component.

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
