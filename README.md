# Animal Crossing Museum Tracker

A cozy companion web app for Animal Crossing (GameCube and Wild World) that helps you track museum donations across multiple towns. Multi-game support for City Folk, New Leaf, and New Horizons is in development.

**Live app:** https://animalcrossingwebapp.vercel.app

---

## Features

- Track donations for all four museum categories: Fish, Bugs, Fossils, and Art
- Manage multiple towns — create, switch, and rename them at any time
- Multi-game support: GameCube and Wild World data included; more games in development
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
- **Zustand v5** (state + localStorage persistence)
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

---

## Version

Current release: **v0.7.0-alpha** — see [CHANGELOG.md](CHANGELOG.md) for history.
