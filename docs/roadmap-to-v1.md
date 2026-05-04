# Roadmap — v0.9.1-beta to v1.0

This document is the canonical roadmap. It supersedes any earlier scattered planning notes.

Last updated: **2026-05-04** (immediately after v0.9.1-beta shipped).

## Where the project sits

- **Current public release:** v0.9.1-beta — ACGCN item icons, `<ItemIcon>` component, `/credits` route, MIT LICENSE, CC BY-SA 3.0 NOTICE for redistributed wiki assets.
- **Cadence:** roughly one focused beta every 2-4 days since v0.6 (April 2026). The path to v1.0 holds that pace.
- **Principle:** one focused track per beta. Polish bundles ship as their own betas, not bundled with feature work.

## Sequence

| Version | Track | Status |
|---|---|---|
| v0.9.1-beta | ACGCN item icons + UI wiring + credits/license | Shipped 2026-05-04 |
| v0.9.2-beta | Cross-game icon routing + per-game gap audit | Next |
| v0.9.3-beta | CSV import (save file / digital cartridge) | Planned |
| v0.9.4-beta | ACWW icon gap-fill | Planned |
| v0.9.5-beta | ACCF icon gap-fill (likely a no-op release after cross-game routing) | Planned |
| v0.9.6-beta | ACNL icon gap-fill | Planned |
| v0.9.7-beta | ACNH icon gap-fill | Planned |
| v0.9.8-beta | SEO basics (OG tags, sitemap, meta, social cards per game) | Planned |
| v0.9.9-beta | Light monetization footer + polish bug sweep | Planned |
| v1.0.0 | Final polish + public ship | Target |

## Track notes

### v0.9.2-beta — cross-game icon routing
Reverse-index the per-game manifests so an item drawn (or scraped) for one game routes to every other game that has it. Generates a per-game audit of what's still missing. The catalog analysis showed 56% of naive-per-game scrape work is redundant — cross-game routing recovers that effort and makes the gap-fill betas dramatically smaller.

### v0.9.3-beta — CSV import
Adds CSV import as the round-trip half of the existing CSV export — a portable save-file / digital-cartridge surface. Pulls testing leverage forward: every release after this is faster to validate because re-creating a fully-completed museum becomes a one-second hydrate. See [issue #88](https://github.com/jacuzzicoding/animalcrossingwebapp/issues/88) for the schema audit and acceptance criteria.

### v0.9.4 → v0.9.7-beta — per-game icon gap fills
After cross-game routing, each remaining game's scrape is much smaller than v0.9.1's was. The per-game catalog audit established the gap sizes:

- ACWW: 9 unique items
- ACCF: 0 unique items (release may collapse to a no-op or be skipped)
- ACNL: 53 unique items
- ACNH: 106 unique items (largest catalog, save for last)

Each release uses the same algorithmic-resolver-plus-OVERRIDES pattern documented in [docs/wiki-scraping-pattern.md](./wiki-scraping-pattern.md).

### v0.9.8-beta — SEO basics
Open Graph tags, sitemap, meta descriptions, social cards per game. One-shot pass to make share links render well and the site discoverable.

### v0.9.9-beta — Light monetization + polish bug sweep
Ko-fi or GH Sponsors footer link. Sweeps remaining polish bugs (currently tracked: #85 mobile category clipping, #92 v0.9.1 post-release polish bundle, anything new from beta use).

### v1.0.0 — Final polish + public ship
The moment the project is ready to share publicly. Reddit launch, portfolio link goes live.

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

Hand-drawn pieces target v1.0; if the count proves unsustainable, the polish track moves to post-v1.0.

Procreate canvas: 512×512 px, transparent background, sRGB, exported as PNG. Filename matches the canonical kebab-case item id (e.g. `sea-bass.png`, `tiger-swallowtail-butterfly.png`).

## Process invariants

These hold across every beta in the sequence:

1. **Two-phase release pattern.** Phase 1 = audit + version bump on a `release/vX.Y.Z` branch, push and stop. Phase 2 = merge → wait for Vercel → smoke-test live → annotated tag → GH pre-release with `--notes-file` → back-merge to development → cleanup.
2. **`gh release create --notes-file`**, never `--notes` inline. Long markdown inline can stall the CLI.
3. **Auto-delete-on-merge** is enabled at the repo level. Branch hygiene is automatic; manual `git push origin --delete` is no longer needed for PR-merged branches.
4. **Single-author voice in all repo artifacts.** PR descriptions, commit messages, GH release notes, doc bodies, and PR comments read as if I personally cut every release.
5. **One focused track per beta.** No pairing data + visual + tooling in one release; each beta has exactly one theme.
