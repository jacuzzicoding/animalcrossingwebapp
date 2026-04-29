# Roadmap

Canonical, single-source-of-truth roadmap for the Animal Crossing Companion web app.
Supersedes the inline roadmap section that previously lived in `CLAUDE.md`.

Last updated: **2026-04-29** (v0.8.0-alpha audit).

---

## Currently shipping: v0.8.0-alpha

Branch: `development` (auto-deploys to https://development-animalcrossingwebapp.vercel.app).
Production (`main`) remains v0.7.0-alpha.

### ✅ Shipped to development (v0.8.0-alpha)

| Feature | PR | Merged | Notes |
|---|---|---|---|
| React Router v6 — URL-based nav for towns and tabs | #38 | 2026-04-23 | `BrowserRouter`; `/town/:townId/:tab` routes; deep links work |
| ACNH item data (81 fish / 80 bugs / 86 fossils / 43 art / 40 sea creatures) | #35 | 2026-04-22 | Dual-hemisphere months (`months_nh` / `months_sh`); `hasFake` on art |
| ACNL item data | #34 | 2026-04-22 | |
| Game selector — ACNL & ACNH added | #36 | 2026-04-22 | Driven from `GAMES` registry |
| Inline item detail expand (fish/bugs/fossils) | #33 | 2026-04-22 | `ItemExpandPanel.tsx`; chevron + rounded-top on `CollectibleRow` |
| Per-town hemisphere toggle (ACNH / ACNL) | #42 | 2026-04-23 | `Game.hasHemispheres` flag |
| Modal centering, iOS zoom, switcher dedupe, dropdown overflow fixes | #41 | 2026-04-23 | UI polish bundle |
| Version bump to `0.8.0-alpha`, git-SHA build badge | — | 2026-04-22 | `vite.config.ts` injects `VITE_APP_VERSION` + `VITE_GIT_SHA` |

### 🟡 In flight (open PRs)

| PR | Title | Branch | Notes |
|---|---|---|---|
| **#44** | Sea Creatures tab for ACNL / ACNH | `feature/sea-creatures-tab` | Data is in repo (PR #35); this PR wires the tab. Needs `CategoryId` union extension and `CATEGORY_META` entry. |
| **#43** | fix: detail-view regression — modal closes immediately after open | `fix/detail-view-regression` | Open partial fix targeting the bottom-sheet flicker. See blocker below. |

### 🔴 Blocked — must clear before v0.8 ships

**Dropdown / month-by-month detail view is missing on Fish / Bugs / Fossils category pages.**

- **Root cause (already diagnosed in a separate session):** commit `2d844c9` (the React Router v6 migration prep) deleted the wiring that mounts `ItemExpandPanel` underneath `CollectibleRow`. The component file still exists but is **orphaned** — nothing imports or renders it.
- **PR #43** is an open partial fix that addresses bottom-sheet flicker but does **not** restore the dropdown wiring.
- **Status:** diagnosis complete. Implementation owned by a separate session — do not duplicate.
- **Blocks v0.8.0 release.** The inline detail view is one of v0.8's headline features and shipping without it would regress visible functionality.

### 📋 Planned for v0.8 (not started)

Items previously listed for v0.8 that have not yet landed and are still in scope:

- **Seasonal / time-based filtering** — currently the month grid is display-only. _(see proposal below — recommended deferral to v0.9.)_
- **Item descriptions in detail view** — schema decision pending. ACNH/ACNL JSON files have a `notes` field rendered by `ItemExpandPanel`, but no separate `description` field. Bea has mentioned "placeholder description data" — needs clarification on whether `notes` is the intended description field or whether a separate field is planned.

### 📝 Cleanup / housekeeping (recommended)

- **Component naming alignment** — recon proposed renaming for clarity:
  - `CreateTownModal` → `CreateTownDialog`
  - `DetailModal` (art bottom sheet) → `ItemDetailSheet`
  - `ItemExpandPanel` → `ItemDetailDropdown`
  - _Not done in this audit branch._ Bundle as a single rename PR after v0.8 ships, or fold into v0.9 polish.
- **Re-import the orphaned `ItemExpandPanel`** — happens as part of the blocker fix.

### ❓ Ambiguous — needs Bea's call

1. Sea creatures tab — Bea mentioned this as shipped on the v0.8 line. Ground truth: data shipped (PR #35), tab UI **not yet merged** (PR #44 still open). Counts as shipped or pending?
2. Item descriptions — `notes` field exists and is rendered. Was Bea's "placeholder description data" referring to `notes`, or to a separate field still pending?
3. Seasonal/time-based filtering — keep in v0.8 scope or defer to v0.9? Recommendation below.
4. Should the orphaned-component-rename pass be part of v0.8, or pushed to v0.9?

---

## Proposed v0.8.0 definition-of-done

> **Status: proposal — pending Bea's approval.**

To promote `v0.8.0-alpha` → `v0.8.0` and ship to `main`:

1. **Land the dropdown detail-view fix** — restore the wiring deleted by `2d844c9`. Non-negotiable: ships the headline feature.
2. **Land PR #44 — Sea Creatures tab** — extend `CategoryId` union, add `CATEGORY_META` entry, route, and tab.
3. **Resolve PR #43** — either merge (if it covers the bottom-sheet flicker independently) or close as superseded by the wiring restoration.
4. **Clarify item descriptions** — confirm `notes` is the intended description field for v0.8, or split into a separate field.
5. **CHANGELOG** — promote `## [v0.8.0-alpha] — In Progress` to `## [v0.8.0] — <date>` with full Added / Changed / Fixed sections; squash the duplicate `### Added` block.
6. **Smoke-test on dev preview** — open every tab on every game, every hemisphere, item dropdown opens and closes cleanly, donate toggle works from the dropdown.
7. **Tag** `v0.8.0` and merge `development` → `main`.

### Recommended deferrals to v0.9

- **Seasonal / time-based filtering** — meaningful new surface area; better as its own release line than bundled with already-complete features.
- **Component renaming pass** (`CreateTownDialog` etc.) — pure refactor, fits naturally with the v0.9 "polish, onboarding, PWA" theme.
- **Polished item descriptions** (separate field, richer formatting) — if `notes` is the v0.8 placeholder, the polished version belongs in v0.9.

---

## Future versions

### v0.9 — Polish, onboarding, and PWA
- UI redesign pass
- PWA support (offline, installable)
- Mobile-first responsive pass
- First-run onboarding flow
- Seasonal / time-based filtering (deferred from v0.8)
- Polished item descriptions (deferred from v0.8)
- Component naming alignment (deferred from v0.8)

### v1.0 — Launch ready
- Branding finalization
- SEO
- Accessibility audit (WCAG 2.1 AA)
- Performance audit and optimization

---

## How this doc is maintained

- Update this file in the **same PR** as any roadmap-affecting change (new feature, scope change, deferral).
- `CLAUDE.md` should only point at this file, not duplicate the roadmap.
- The `### Shipped to development` table is append-only within an alpha cycle; on release, collapse it into the version's CHANGELOG entry and start a fresh table for the next alpha.
