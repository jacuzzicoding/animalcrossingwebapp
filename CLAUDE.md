# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (prompts for platform)
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Lint
npm run lint
```

There is no test suite configured.

## Architecture

This is a **React Native / Expo** app using **expo-router** (file-based routing). It tracks museum donations across multiple Animal Crossing towns.

### Routing

expo-router with typed routes enabled. Route tree:
- `app/(tabs)/` — tab navigator: Home, Museum, Search, Analytics
- `app/museum/[category].tsx` — collectible list for a category (fish/bugs/fossils/art)
- `app/item/[category]/[id].tsx` — individual item detail
- `app/town/create.tsx` / `app/town/edit.tsx` — modal screens

### State Management

All state lives in a single **Zustand** store (`store/index.ts`) persisted to AsyncStorage under the key `ac-companion-storage`.

Key state shape:
- `towns: Town[]` — user-created towns (each tied to an `ACGame`)
- `activeTownId` — which town's data is shown
- `donations: Record<townId, Record<itemId, DonationRecord>>` — flat donation log per town

Selectors (`getProgress`, `getCategoryProgress`) compute progress on the fly from the donations map.

### Data

Static collectible data lives in `data/` (fish, bugs, fossils, art). Each file exports a typed array matching the interfaces in `types/index.ts`. The `data/index.ts` barrel re-exports everything and computes `TOTAL_BY_CATEGORY` / `GRAND_TOTAL` from array lengths.

Adding a new game's data means adding items to those arrays with the correct `games: ACGame[]` field — the store and UI derive counts automatically.

### Types

`types/index.ts` defines the full type system:
- `ACGame` — union of 5 game IDs (`ACGCN` | `ACWW` | `ACCF` | `ACNL` | `ACNH`)
- `Category` — `'fish' | 'bugs' | 'fossils' | 'art'`
- `CollectibleData` — discriminated union of `FishData | BugData | FossilData | ArtData`
- `Town`, `DonationRecord`, `CategoryProgress`, `OverallProgress`

### Styling

No styling library — plain `StyleSheet.create`. All colors come from `constants/colors.ts` (`Colors` object and `CategoryColors` map). The palette is a warm Animal Crossing GCN earth-tone theme. Never hard-code color values; always reference `Colors` or `CategoryColors`.

### Path aliases

`@/` maps to the repo root (configured in `tsconfig.json`).

## Session Notes (April 2026)

### Critical: Expo SDK Version
**Always use SDK 54.** Bea's iPhone Expo Go is locked to SDK 54. Do NOT let expo upgrade to 55.
`package.json` is pinned to `"expo": "~54.0.0"` — keep it that way.

### Install
```bash
npm install --legacy-peer-deps   # plain npm install fails — peer dep conflicts
```

### Current Status (April 2026 — session 2)
App is running and functional at http://localhost:8081. Three dependency bugs were found and fixed this session:

1. **react-native-reanimated** was `~4.1.1` (required missing `react-native-worklets` → blank white screen). Fixed to `~3.16.2`.
2. **zustand** was `^5.0.1` (ESM middleware used `import.meta` → bundle crash). Fixed to `^4.5.2`. See note below.
3. **Metro config** — created `metro.config.js` to pin resolver conditions to `['react-native', 'require', 'default']`, preventing Metro from resolving zustand's `.mjs` files even in v4.

**Create Town flow is confirmed working.** App renders, navigation works, town creation persists.

Next session: UI review pass across all 4 tabs and modal screens. Then data accuracy check (118 items vs actual ACGCN content).

### Deferred to v2
- Villager tracking
- Multi-game UI (type system supports it, UI is GCN-first)
- App icons / splash screen
- App Store / Play Store submission

### NODE_ENV=production gotcha
If `NODE_ENV=production` is set in the shell environment (common in some setups), npm skips devDependencies (`typescript`, `@types/react`). This causes Expo to throw a TypeScript dependency error at startup even though the packages appear in `package.json`.

**Always prefix installs and `npm start` with `NODE_ENV=development`:**
```bash
NODE_ENV=development npm install --legacy-peer-deps
NODE_ENV=development npm start
```

### Zustand: must stay on v4, not v5
Zustand v5's `middleware.mjs` uses `import.meta.env` for devtools detection. Metro cannot handle `import.meta` outside a true ES module context, so importing from `zustand/middleware` (even just `persist`) crashes the whole web bundle with `SyntaxError: Cannot use 'import.meta' outside a module`. The store API is identical in v4. Keep pinned to `^4.5.2`.

### Correct SDK-54 package versions (resolved April 2026)
These are confirmed working — do not upgrade without testing:
- `expo-router`: `~6.0.23`
- `expo-font`: `~14.0.11`
- `expo-linking`: `~8.0.11`
- `expo-splash-screen`: `~31.0.13`
- `expo-status-bar`: `~3.0.9`
- `expo-system-ui`: `~6.0.9`
- `react-native`: `0.81.5`
- `react`: `19.1.0`
- `react-native-reanimated`: `~3.16.2` ⚠️ do NOT use v4 — requires react-native-worklets
- `zustand`: `^4.5.2` ⚠️ do NOT use v5 — ESM middleware breaks Metro web build
- `typescript`: `~5.9.2` (devDep)
- `@types/react`: `~19.1.10` (devDep)
