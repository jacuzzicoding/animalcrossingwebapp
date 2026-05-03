# Animal Crossing Museum Tracker

A cozy companion web app for tracking Animal Crossing museum donations across multiple towns. Supports all five mainline games: GameCube, Wild World, City Folk, New Leaf, and New Horizons.

**Live app:** https://animalcrossingwebapp.vercel.app

---

## Features

- Track donations for all museum categories: Fish, Bugs, Fossils, Art, and Sea Creatures
- Manage multiple towns — create, switch, and rename them at any time
- **Five games supported:** Animal Crossing (GCN), Wild World, City Folk, New Leaf, New Horizons
- **Item inline expand** — tap a Fish, Bug, or Fossil row to expand it in-place: month availability grid, sell value, habitat, and donate/undonate button (powered by `ItemExpandPanel`)
- **Bottom-sheet detail view** — Art rows and Search results open a full detail sheet (`DetailModal`)
- **Hemisphere toggle** — New Horizons towns show an NH/SH toggle; month grids reflect the correct hemisphere
- **URL-based navigation** — every town and tab has a shareable URL via React Router v6
- Home screen with seasonal availability, leaving-soon alerts, and progress cards
- Global search across all categories
- Stats tab with collection analytics and monthly availability chart
- Recent activity feed per town
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

Current release: **v0.8.2-alpha** (last stable). Active development: **v0.9.0-beta** — see [CHANGELOG.md](CHANGELOG.md) for history and [docs/v0.9-plan.md](docs/v0.9-plan.md) for the in-progress plan.

Significant design decisions are logged in [docs/decisions.md](docs/decisions.md).
