# Animal Crossing Museum Tracker

A cozy companion web app for tracking Animal Crossing museum donations across multiple towns. Supports all five mainline games: GameCube, Wild World, City Folk, New Leaf, and New Horizons.

**Live app:** https://animalcrossingwebapp.vercel.app

---

## Features

- Track donations for all museum categories: Fish, Bugs, Fossils, Art, and Sea Creatures
- Manage multiple towns from a single TownManager drawer — switch, rename, create, and delete (game is locked at create-time)
- **Five games supported:** Animal Crossing (GCN), Wild World, City Folk, New Leaf, New Horizons
- **Persistent left sidebar** with brand, active town card, per-category donation counts, and Export CSV / Settings footer
- **Inline item expand** — tap any row (Fish, Bugs, Fossils, Sea Creatures, or Art) to open a two-column panel with the month availability grid, bells / shadow / hours / `basedOn` real-world reference / Crazy Redd authentication note (ACNH art), notes, and donate/undonate button
- **Hemisphere toggle** — New Horizons towns expose an NH/SH toggle; month grids reflect the correct hemisphere
- **URL-based navigation** — every town and tab has a shareable URL via React Router v6
- Home screen with hero stat, current-month strip, "Leaving end of {month}" and "Just arrived" shelves, segmented progress meter, and latest donations
- Sectioned category pages — Leaving this month / Available now / Out of season / Already donated
- Unified global search dropdown with grouped category results, keyboard navigation, and recent-search history
- Stats tab with per-category cards and a 12-column "Yearly rhythm" availability chart
- Settings page — About + Danger zone (reset active town donations, reset everything)
- CSV export of your donation records
- Fully persistent — data saved to localStorage, no account required

---

## Tech Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4**
- **Zustand v5** (state + localStorage persistence, schema v3)
- **React Router v6** (URL-based navigation)
- **Vitest** (unit tests)
- **Vercel** (hosting + analytics)

---

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # Production build → dist/
npm run test      # Run unit tests
npm run lint      # Lint with ESLint
```

---

## Data

Museum data lives in `public/data/<game>/`:
- `public/data/acgcn/` — GameCube: 40 fish, 40 bugs, 25 fossils, 13 paintings
- `public/data/acww/` — Wild World: 56 fish, 56 bugs, 52 fossils
- `public/data/accf/` — City Folk: 40 fish, 40 bugs, 52 fossils
- `public/data/acnl/` — New Leaf: fish, bugs, fossils
- `public/data/acnh/` — New Horizons: 81 fish, 80 bugs, 86 fossils, 43 art, 40 sea creatures (NH/SH month availability)

> Sea creatures are fully supported for New Horizons and New Leaf — a dedicated Sea entry appears in the sidebar nav for those games (shipped in v0.8.2).

---

## Version

Current release: **v0.8.2-alpha** (last stable on `main`). Active development: **v0.9.0-beta** — Phases 1–9 of the UI revamp shipped to `development`; Phase 10 (mobile responsive verification) pending. See [CHANGELOG.md](CHANGELOG.md) for history and [docs/v0.9-plan.md](docs/v0.9-plan.md) for the canonical plan.

Significant design decisions are logged in [docs/decisions.md](docs/decisions.md).
