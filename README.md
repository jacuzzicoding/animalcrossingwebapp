# Animal Crossing GCN Museum Tracker

A cozy companion web app for Animal Crossing (GameCube) that helps you track museum donations across multiple towns.

**Live app:** https://animalcrossingwebapp.vercel.app

---

## Features

- Track donations for all four museum categories: Fish, Bugs, Fossils, and Art
- Manage multiple towns — switch between them at any time
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

Museum data lives in `public/data/acgcn/`:
- `fish.json` — 40 species with monthly availability
- `bugs.json` — 40 species with monthly availability
- `fossils.json` — 25 fossil pieces
- `art.json` — 13 paintings

---

## Version

Current release: **v0.6.1** — see [CHANGELOG.md](CHANGELOG.md) for history.
