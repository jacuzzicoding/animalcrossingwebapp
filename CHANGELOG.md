# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- **Migration test coverage** (#151) — added `storeMigrations.test.ts` (9 tests over the v1→v2 donation lift + gameId backfill and the v2→v3 hemisphere backfill, including idempotency) and `bootstrapMigration.test.ts` (5 tests over the one-time localStorage key rename). These guard the documented zero-data-loss path for pre-v0.7 users, which previously had no tests. Surfaced by the v0.9.6-beta codebase health audit (TEST-1)

### Changed

- **Re-encoded oversized raster icons** (#152) — the raw wiki-scraped art and fossil `.jpg` icons under `public/icons/` shipped at full wiki resolution (e.g. `art/informative-statue.jpg` at 3.8 MB / 3665×4288) but render into 48–192px slots. Downsampled all 113 oversized art + fossil JPGs in place to ≤384px (mozjpeg q80) via a new `npm run icons:reencode` script: 14.85 MB → 1.31 MB (~91% smaller); the Art tab drops from ~11.5 MB to ~1.1 MB. Filenames and extensions are unchanged, so `manifest.json` stays valid and there is no app code change. Icon coverage unchanged (verified via `npm run audit:icons`). Surfaced by the v0.9.6-beta codebase health audit (PERF-1)

### Removed

- **Dead code cleanup** (#157) — deleted four files with zero importers: `src/lib/colors.ts` (the `meadow`/`colors`/`fontStacks` token mirror, fully superseded by the `@theme` block in `src/index.css`), `src/components/shared/CategoryProgress.tsx`, `src/components/shared/DonateToggle.tsx`, and `src/components/shared/HabitatChip.tsx`. Corrected stale CLAUDE.md claims (the "legacy colors retained" note, the DonateToggle/ActivityFeed consumer descriptions) and the v0.9.5→v0.9.6-beta version drift in CLAUDE.md + README. Surfaced by the v0.9.6-beta codebase health audit (CH-3)

### Fixed

- **bootstrapMigration no longer deletes the old key on a corrupt new key** (#151) — `bootstrapLocalStorageMigration` now removes `ac-web:v1` only once `ac-web` is present **and** parses as JSON. Previously a corrupted `ac-web` value would trigger deletion of the only remaining valid copy of pre-rename data. Surfaced by the v0.9.6-beta codebase health audit (DI-6)
- **Import modal button contrast** (#153) — `.ac-im-cta` now uses `color: var(--surface)` instead of `var(--accent-ink)` on the moss-green background, lifting the import flow's primary CTA from ~2.7:1 to ~4.6:1 (AA). The destructive-confirm `.ac-im-cta-danger` now uses the danger-zone strong red (white-on-red ~6.4:1) instead of `--warn` (~3.8:1). Surfaced by the v0.9.6-beta codebase health audit (A11Y-1)

## [v0.9.6-beta] — 2026-05-24

### Added

- **ACNH icon gap-fill** (PR #140) — 88 wiki-scraped items added across all five ACNH categories via the Fandom MediaWiki + algorithmic-resolver-plus-`OVERRIDES` pattern. ACNH icon coverage goes from 68.8% → **95.5%** (315/330). Fifteen items remain genuine wiki gaps — logged to `scripts/missing-acnh.txt` with one-line reasons; they fall through to the existing monogram placeholder
- ~50 new ACNH entries in `OVERRIDES` — multi-part fossil pieces collapse to their parent species article (same pattern as the ACWW `ankylosaur-*` / ACNL `megacero-*` families)
- Hand-drawn `fish/goldfish.png` icon (PR #136) — eighth hand-drawn piece in the library (after sea-bass, koi, ant, coelacanth, frog, robust cicada, brown cicada). 2048×2048 watercolour-and-ink source at `icon-sources/fish/goldfish.png`; exported to 768×768 (88.9 KB) via `npm run icons:export`. Replaces the scraped wiki placeholder. Cross-game routing propagates this to any game that maps to `fish/goldfish`.
- Hand-drawn `fish/tadpole.png` icon (PR #144) — ninth hand-drawn piece in the library. 2048×2048 Procreate source at `icon-sources/fish/tadpole.png`; exported to 768×768 (24 KB) via `npm run icons:export`
- Hand-drawn `bugs/agrias-butterfly.png` icon (PR #144) — tenth hand-drawn piece. Replaces the wiki-scraped `.jpg` placeholder. 2048×2048 source at `icon-sources/bugs/agrias-butterfly.png`; exported to 768×768 (62 KB) via `npm run icons:export`. Manifest updated from `jpg` → `png` for this entry

### Changed

- **Resolver: `a:sentence` probe** handles MediaWiki's first-character-only auto-capitalization, matching Title-Case catalog names against sentence-case article titles
- **Resolver: `c:search` deprioritizes `* model` furniture pages**, so item lookups land the species/artwork article rather than its furniture-model namesake
- Documentation sync (PRs #135/#137/#138) — corrected stale dates, coverage percentages, and icon counts in `version-history.html` and `CLAUDE.md`; added a visual road-to-v1.0 page with coverage charts

## [v0.9.5-beta] — 2026-05-10

### Added

- **ACNL icon gap-fill** (PR #127) — 135 wiki-scraped items added across all five ACNL categories (23 fish + 28 bugs + 34 fossils + 18 art + 32 sea creatures) via the Fandom MediaWiki + algorithmic-resolver-plus-`OVERRIDES` pattern. ACNL icon coverage goes from 49.1% → **96.5%** (275/285). Ten items remain genuine wiki gaps — logged to `scripts/missing-acnl.txt`; they fall through to the existing monogram placeholder. As a side effect of cross-game ID matching, ACCF reaches **100%** (155/155) and ACNH rises to **68.8%** (227/330)
- 16 new ACNL entries in `OVERRIDES` (resolver ceiling — Latin-genus truncations, anglicized titles, two-word split-panel art, furniture-model wrong-content pages)
- `scripts/fetch-icons-acnl.ts` — new scrape script in the same shape as `fetch-icons-acww.ts`, with a `sea_creatures` category branch for ACNL/ACNH-specific disambiguation (`deep-sea creature` suffix)
- `scripts/spike-acnl-icons.ts` and `scripts/dry-run-acnl-icons.ts` committed as audit paper-trail and template for the v0.9.6 ACNH scrape
- Hand-drawn `fish/frog.png` icon (PR #128) — fifth hand-drawn piece in the library (after sea-bass, koi, coelacanth, ant). Replaces the wiki-scraped placeholder. 2048×2048 Procreate source at `icon-sources/fish/frog.png`; exported to 768×768 (148 KB) via `npm run icons:export`
- Hand-drawn `bugs/robust-cicada.png` and `bugs/brown-cicada.png` icons (PR #131) — sixth and seventh hand-drawn pieces. Replaces scraped Fandom placeholders. 2048×2048 sources at `icon-sources/bugs/`; exported to 768×768 (68 KB each) via `npm run icons:export`

### Changed

- **Resolver: deprioritize `/Gallery` subpages** in `c:search` results — parent article now tried first; gallery remains a graceful fallback when it's the only image source. Generalizes to ACNH next cycle
- **Resolver: `sea_creatures: 'deep-sea creature'` disambig step** — lands the parent article for ACNL/ACNH sea creatures whose Fandom entries share a name with another category (octopus, lobster, pearl oyster)

### Fixed

- `version-history.html` velocity headline corrected from "25 days" to "29 days" (PR #130, Closes #124)
- `useIconChecker` closure memoized with `useMemo` to avoid a new function allocation on every render (PR #130, Closes #95)
- `vi.unstubAllGlobals()` added to `ItemIcon.test.tsx` `afterEach` to prevent global stub leakage between test files (PR #130, addresses #92 item 4)

## [v0.9.4-beta] — 2026-05-07

### Added

- **Silhouette rendering for un-donated items** (PR #118, Closes #116) — un-donated species now render as black silhouettes that fade to full color on donation, matching the canonical Animal Crossing museum experience. Implemented as a CSS `filter: brightness(0)` on the existing PNGs (no new assets) with a 300ms reveal transition; honors `prefers-reduced-motion`. New "Museum display" section in Settings with a single global toggle (`museumDisplay.silhouettesEnabled` in the persisted store, default ON). `ItemIcon` accepts a new optional `donated` prop and conveys donation state via `alt` text for screen readers ("Coelacanth, not yet donated" / ", donated"). Applies across category rows, expand panels, Home shelves, search results, and the recent-activity feed
- **ACWW icon gap-fill** (PR #119) — 84 wiki-scraped items added (21 fish + 27 bugs + 27 fossils + 9 art) via the established Fandom MediaWiki + algorithmic-resolver-plus-`OVERRIDES` pattern documented in `docs/wiki-scraping-pattern.md`. ACWW icon coverage now stands at 100%. As a side effect of cross-game ID matching, ACCF coverage rose to 95.5%, ACNL to 49.1%, and ACNH to 39.1% — partial free coverage for the upcoming v0.9.5/v0.9.6 betas
- Hand-drawn `fish/coelacanth.png` icon (PR #114) — fourth hand-drawn piece in the library after sea-bass, koi, and ant. 2048 source committed at `icon-sources/fish/coelacanth.png`

### Changed

- **Icon export pipeline `TARGET_SIZE` bumped 512 → 768** (PR #115) — `scripts/export-icons.ts` now resizes 2048 sources to 768×768 (was 512). All four hand-drawn pieces (ant, koi, sea-bass, coelacanth) re-exported at the new resolution. Preserves painterly detail at the larger expand-panel render sizes introduced in v0.9.2 without changing the source workflow

## [v0.9.3-beta] — 2026-05-06

### Added

- Hand-drawn `bugs/ant.png` icon (ACGCN) — 2048 source committed at `icon-sources/bugs/ant.png`, exported through the v0.9.2 pipeline. Replaces the wiki-scraped placeholder. Third hand-drawn icon after sea-bass and koi
- JSON save-file export (v0.9.3 PR 1/2) — new `Export save` button in the sidebar foot writes `ac-save-<town>-<date>.json`, a versioned, lossless format carrying `schemaVersion`, `app`, `appVersion`, `exportedAt`, full `town` metadata (name, gameId, hemisphere for ACNH, createdAt), and the donation list keyed by store-native `itemId` + `category` + ISO `donatedAt`. Schema lives in `src/lib/saveFile.ts`; format is documented in `docs/v0.9.3-csv-import-plan.md` §4. Round-trip importer follows in PR 2
- JSON save-file import (v0.9.3 PR 2/2) — round-trip companion to the export. New `Import save` button in the sidebar footer and an `Import save instead` affordance in the empty-state TownManager open the import modal. Parser + validator in `src/lib/saveFileImport.ts` rejects non-`schemaVersion=1` files, wrong-app files, missing/malformed required fields, unknown `gameId`, and ACNH saves missing a hemisphere; tolerates malformed donation rows by dropping them with a count. Reconciliation in `src/lib/saveFileReconcile.ts` matches on `(name, gameId)` and produces one of three plans — Replace (wipe + write), Merge (union, earlier `donatedAt` wins on conflict), or Import-as-new (create a fresh town). Items missing from the loaded data files are dropped silently with a count surfaced in the modal. Replace into a town with existing donations gates behind a heavy two-step "YOU CAN NOT GO BACK" confirmation; Replace into an empty town skips it. The store gets a single atomic `applyImportedSave(plan)` action

### Changed

- The sidebar's single "Export CSV" control is now two distinct buttons — `Export save` (the new JSON save file) and `Download report` (the existing human-readable CSV, unchanged). The CSV remains for users pasting into spreadsheets; the JSON file is the new round-trip artifact
- The empty-state TownManager (no towns yet) gained an "Import save instead" affordance, so a fresh-device user can restore from a save file without first creating a placeholder town

### Fixed

- Canvas empty-state message ("Create a town to start tracking your museum donations.") no longer renders behind the TownManager backdrop blur on first load. When `townManagerOpen` is true, the drawer is the active onboarding surface, so the canvas message is suppressed (Closes #107)
- Import-save affordance now visible during first-load onboarding. Previously, `App.tsx` calling `openTownManager(forceCreate=true)` immediately set `creating=true`, collapsing `showEmptyState` to `false` before first paint and hiding the import button entirely. An "or import an existing save" secondary link is now rendered below the `NewTownForm` whenever `creating && towns.length === 0`

## [v0.9.2-beta] — 2026-05-05

### Added

- 2048×2048 hand-drawn source PNGs committed under `icon-sources/<category>/<id>.png` as the canonical originals. The first two land here: `icon-sources/fish/sea-bass.png` and `icon-sources/fish/koi.png`
- `scripts/export-icons.ts` — local-only pipeline that resizes 2048 sources to 512×512, palette-quantizes via pngquant, and writes the deploy assets to `public/icons/<category>/<id>.png`. Idempotent (skips when the output is newer than its source); supports `--force` and `--dry-run`. Wired as `npm run icons:export`. Not run in CI
- `scripts/audit-icon-coverage.ts` — reports per-game icon coverage against catalog data, surfaces missing items and orphan files. Wired as `npm run audit:icons`

### Changed

- **Cross-game icon routing** — items shared across games (sea bass, koi, common butterfly, every shared fossil) now share a single icon file. Icon hierarchy flattened from per-game subdirectories to `public/icons/<category>/<id>.png`; a `RENAME_OVERRIDES` map handles ids that differ between games; resolver simplified accordingly. Adding a new game's catalog now lights up icon coverage automatically wherever ids match
- Item icon render sizes increased to give the hand-drawn art room to read: category rows 32→48, expand panel 64→192 (with a 128 step at ≤1180px and existing hide-at-≤720 unchanged), search dropdown 24→32, home shelf + recent rows 24→32. Fallback monogram glyphs scaled to match: `.ac-glyph` 32→48, `.ac-gs-row-glyph` 28→32. Expand panel `padding-left` extended to clear the larger absolute-positioned icon
- `ActivityFeed` (recent donations card on Home) renders `<ItemIcon>` instead of the legacy `CATEGORY_META` monogram tile — final surface migrated to the shared icon component (Closes #97)
- `public/version-history.html` trimmed for clarity; v0.9.0 release date corrected; emoji removed from the velocity banner

### Fixed

- Mona Lisa icon clipped at the bottom of the expand panel — added a min-height for the art icon slot
- iOS overscroll bounce revealed the wrong background colour — `html` and `body` background unified

### Notes

- ACGCN icons remain wiki-sourced; the two hand-drawn replacements (sea-bass, koi) preview the long-term direction. No regression to existing ACGCN coverage

## [v0.9.1-beta] — 2026-05-04

### Added

- Animal Crossing (GameCube) item icons — fish, bugs, fossils, and art (118 items total) sourced from the AC Fandom Wiki under CC BY-SA 3.0
- `<ItemIcon>` shared component renders icons across category rows (32×32), expand panels (64×64, hidden ≤720px), global search results (24×24), and home tab shelf + recent activity (24×24); falls back to the existing tinted-monogram glyph when an icon is missing
- `/credits` route documenting third-party asset sources and licensing, linked from the sidebar footer
- `LICENSE` (MIT) and `NOTICE` files at the repo root
- `manifest.json` per game under `public/icons/<gameId>/` drives icon resolution; `npm run icons:manifest` regenerates it
- Wiki-scraping scripts (`scripts/fetch-icons.ts`, `scripts/spike-fandom-coverage.ts`) and an expanded `scripts/README.md` with methodology notes

### Changed

- Icon rendering is data-driven — adding a `manifest.json` for a future game (ACWW, ACCF, ACNL, ACNH) lights up its UI automatically with no code change. Replaces the earlier `GAMES_WITH_ICONS = { ACGCN }` allowlist
- ESLint config no longer flags `scripts/` Node-only code; `tsx` added as a devDependency so the icon scripts run from `npm` scripts

### Fixed

- `ItemExpandPanel` padding-left expanded to clear the absolute-positioned icon

### Notes

- Other games continue to render the existing monogram fallback until their respective icon scrapes ship in subsequent v0.9.x betas
- Per-piece fossil icons share a single per-species image where the source only provides one render — flagged for hand-drawn replacement on a later polish pass

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
  donated fish/bugs available _in-game per season_ (based on `months[]` data), not the
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
- Cozy parchment/GameCube aesthetic with inline hex design tokens
- Data files: `fish.json` (40 species), `bugs.json` (40 species), `fossils.json` (25 items), `art.json` (13 paintings)
- GitHub CI workflow and Vercel deployment
