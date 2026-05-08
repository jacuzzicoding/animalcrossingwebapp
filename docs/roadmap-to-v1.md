# Roadmap — v0.9.1-beta to v1.0

This document is the canonical roadmap. It supersedes any earlier scattered planning notes.

Last updated: **2026-05-07** (after v0.9.4-beta shipped).

## Where the project sits

- **Current public release:** v0.9.4-beta — silhouette rendering for un-donated items, ACWW icon gap-fill (100% coverage), 768px hand-drawn icon pipeline, fourth hand-drawn icon (coelacanth).
- **Cadence:** roughly one focused beta every 2-4 days since v0.6 (April 2026). The path to v1.0 holds that pace.
- **Principle:** one focused track per beta. Polish bundles ship as their own betas, not bundled with feature work.

## Sequence

| Version | Track | Status |
|---|---|---|
| v0.9.1-beta | ACGCN item icons + UI wiring + credits/license | Shipped 2026-05-04 |
| v0.9.2-beta | Cross-game icon routing + per-game gap audit | Shipped 2026-05-05 |
| v0.9.3-beta | JSON save-file round-trip (export + import) + first hand-drawn bug (ant) | Shipped 2026-05-06 |
| v0.9.4-beta | Silhouette rendering for un-donated items + ACWW icon gap-fill + higher-res hand-drawn icons | Shipped 2026-05-07 |
| v0.9.5-beta | ACNL icon gap-fill (53 items) | Planned |
| v0.9.6-beta | ACNH icon gap-fill (106 items) | Planned |
| v0.9.7-beta | SEO basics (OG tags, sitemap, meta, social cards per game) | Planned |
| v0.9.8-beta | Light monetization footer + polish bug sweep | Planned |
| v1.0.0 | Final polish + public ship + all hand-drawn icons | Target |

## Track notes

### v0.9.2-beta — cross-game icon routing
Shipped 2026-05-05. Reverse-indexed the per-game manifests so an item drawn (or scraped) for one game routes to every other game that has it. Generated a per-game audit of what's still missing. The catalog analysis showed 56% of naive-per-game scrape work is redundant — cross-game routing recovers that effort and makes the gap-fill betas dramatically smaller.

### v0.9.3-beta — JSON save-file round-trip
Shipped 2026-05-06. The original scoping targeted CSV import as the round-trip complement to CSV export; during scoping it became clear that JSON fit the schema needs better — versioned, lossless round-trip, structured per-game donation records. The shipped feature exports a full save file (`ac-save-<town>-<date>.json`) and imports it via a modal with three reconciliation modes: Replace, Merge, and Import as new town. Two-step destructive confirmation guards Replace when the target town has existing data.

v0.9.3 also delivered the first hand-drawn bug: ant. The ACGCN ant joins koi, sea-bass, and coelacanth (fish) as the first four hand-drawn pieces in the library.

### v0.9.4-beta — silhouette rendering + ACWW gap-fill + higher-res hand-drawn icons
Shipped 2026-05-07. Bundles three related tracks:

**Silhouette rendering (headline feature, PR #118, issue #116).** CSS-filter-based silhouette rendering for un-donated items across all four categories. A new "Museum display" section in Settings exposes a toggle (default ON). Un-donated items render as a dark silhouette; donating an item triggers a 300ms reveal animation. `prefers-reduced-motion` is honored, and `aria-label` conveys species + donation state for screen readers. Faithful to the canonical Animal Crossing museum experience of seeing silhouettes until a piece is donated.

**ACWW icon gap-fill (PR #119).** 84 items scraped from the Fandom wiki (21 fish + 27 bugs + 27 fossils + 9 art) via the established algorithmic-resolver-plus-OVERRIDES pattern. ACWW icon coverage now stands at 100%. As a side effect of cross-game ID matching introduced in v0.9.2, ACCF coverage rose to 95.5%, ACNL to 49.1%, and ACNH to 39.1% — partial free coverage for the upcoming v0.9.5/v0.9.6 betas.

**Higher-resolution hand-drawn icons.** The icon export pipeline's TARGET_SIZE was bumped from 512 → 768 (PR #115), preserving painterly detail at larger display sizes. All four hand-drawn pieces (ant, koi, sea-bass, coelacanth) were re-exported at the new resolution. Coelacanth (PR #114) is the fourth hand-drawn piece in the library.

One-track-per-beta is preserved in spirit: silhouette is the headline feature. The icon work is supporting asset/data changes, not a parallel feature.

### v0.9.5 / v0.9.6-beta — per-game icon gap fills
After cross-game routing, each remaining game's scrape is much smaller than v0.9.1's was. The per-game catalog audit established the remaining gap sizes:

- ACNL: 53 unique items
- ACNH: 106 unique items (largest catalog, save for last)

ACCF has 0 unique items after cross-game routing — no release needed for that game.

Each release uses the same algorithmic-resolver-plus-OVERRIDES pattern documented in [docs/wiki-scraping-pattern.md](./wiki-scraping-pattern.md).

### v0.9.7-beta — SEO basics
Open Graph tags, sitemap, meta descriptions, social cards per game. One-shot pass to make share links render well and the site discoverable.

### v0.9.8-beta — Light monetization + polish bug sweep
Ko-fi or GH Sponsors footer link. Sweeps remaining polish bugs (currently tracked: #85 mobile category clipping, #92 v0.9.1 post-release polish bundle, anything new from beta use).

### v1.0.0 — Final polish + public ship
The moment the project is ready to share publicly. Reddit launch, portfolio link goes live. All 255 hand-drawn icons complete (94 fish + 116 bugs + 45 sea creatures).

## Post-v1.0 ideas

Not scoped for the v1.0 release, but worth preserving for future planning:

- **Challenge Mode.** A more aggressive spoiler/discovery layer building on the v1.0 silhouette feature. Un-donated item names are hidden ("????") and the donation interaction shifts toward typing the species name. Requires UI rework: name-input flow, fuzzy matching, anti-frustration patterns. Spun off the silhouette brainstorm 2026-05-07.
- **Art real-vs-fake mechanic.** ACNL/ACNH-only feature surfacing a "real vs fake" identification flow during art donations. Requires sourcing reference data not in the current scrape pipelines.

## Hand-drawn icon plan

The wiki-sourced icons in v0.9.1+ are placeholders. The long-term plan is hand-drawn replacements covering all 5 games via cross-game routing — one drawing per item-id propagates to every game that has it.

Scope decisions:
- **Fossils:** ship one generic placeholder drawing covering all fossil pieces. No per-piece, no per-species. Drops 153 distinct items to 1.
- **Art:** use actual public-domain artwork (Vitruvian Man, The Birth of Venus, etc. — which is what AC's art pieces depict). Drops 45 hand-drawn pieces to 0.
- **Fish + bugs + sea creatures:** the real hand-drawn target. Per-category totals: 94 fish, 116 bugs, 45 sea creatures = **255 distinct pieces** for full series coverage.

Per-game new items (the workload added by each release):

| Game | Fish | Bugs | Sea creatures | Total new |
|---|---:|---:|---:|---:|
| ACGCN | 40 | 40 | — | 80 |
| ACWW | 21 | 27 | — | 48 |
| ACCF | 0 | 0 | — | 0 |
| ACNL | 23 | 28 | 35 | 86 |
| ACNH | 10 | 21 | 10 | 41 |
| **Total** | **94** | **116** | **45** | **255** |

**Progress as of 2026-05-07:** 4 of 255 complete — ant (bug), koi (fish), sea-bass (fish), coelacanth (fish).

**Procreate canvas:** 2048×2048 px, transparent background, sRGB, exported as PNG. The production pipeline (sharp + pngquant) re-exports to 768×768 for deployment via `npm run icons:export`. Filename matches the canonical kebab-case item id (e.g. `sea-bass.png`, `tiger-swallowtail-butterfly.png`). Originals committed to `icon-sources/` for archival and reproduction.

The process of reusing fish bodies/silhouettes and editing variants reduces per-icon time significantly for closely-related species. Hand-drawn pieces target v1.0; if the count proves unsustainable before ship, the remaining pieces shift to a post-v1.0 polish track.

## Cloud-hosted full-resolution gallery (opportunistic)

Each hand-drawn piece is painted at 2048×2048 — there's value in surfacing the full-resolution work somewhere beyond the 768px production export. A "view full art" link on item detail panels, or a dedicated `/gallery` route, could surface the 2048 sources. Hosting options include Cloudinary, Vercel Blob, Cloudflare Images, and GitHub LFS — each has cost, CDN, and on-the-fly transformation tradeoffs.

**Status: opportunistic — explore if easy, not a release blocker for v1.0.**

## Process invariants

These hold across every beta in the sequence:

1. **Two-phase release pattern.** Phase 1 = audit + version bump on a `release/vX.Y.Z` branch, push and stop. Phase 2 = merge → wait for Vercel → smoke-test live → annotated tag → GH pre-release with `--notes-file` → back-merge to development → cleanup.
2. **`gh release create --notes-file`**, never `--notes` inline. Long markdown inline can stall the CLI.
3. **Auto-delete-on-merge** is enabled at the repo level. Branch hygiene is automatic; manual `git push origin --delete` is no longer needed for PR-merged branches.
4. **Single-author voice in all repo artifacts.** PR descriptions, commit messages, GH release notes, doc bodies, and PR comments read as if I personally cut every release.
5. **One focused track per beta.** No pairing data + visual + tooling in one release; each beta has exactly one theme.
