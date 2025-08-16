# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an Animal Crossing GameCube Fish-only MVP web application built with Vite + React + TypeScript. The app provides a single-page museum interface for tracking fish donations with a cozy parchment aesthetic.

## Development Commands
- `npm run dev` - Start development server  
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run preview` - Preview production build
- `npm run extract-data` - Re-extract fish data from Swift repository source

## Architecture & Data Flow

### Core State Management
- **Zustand store** (`src/lib/store.ts`) with localStorage persistence for donation tracking
- Store key: `ac-web:donated:v0` persists user's donation progress
- Fish data loaded dynamically from `/public/data/acgcn/fish.json`

### Type System
- **Fish interface** (`src/lib/types.ts`) defines core data structure
- Habitat types: `river | ocean | pond | lake | other`
- Optional time-based availability via `months[]` and `hours[]` arrays

### Data Generation Pipeline
The fish data comes from external Swift repository analysis:
- **Source**: `/Users/brockjenkinson/Documents/Claude_Repos/AnimalCrossingGCN-Tracker`
- **Extractor**: `scripts/extract-fish-data.js` searches Swift files and applies validation
- **Output**: `public/data/acgcn/fish.json` (41 fish species with normalized schema)
- **Schema**: Each fish has id, name, value (bells), habitat, optional months/hours/notes

### UI Architecture
- **Single component**: `ACCanvas.tsx` handles entire application UI
- **No routing**: Single-page application showing all fish with search/filter
- **Cozy design system**: Custom Tailwind palette mimicking GameCube museum aesthetic
- **Progress tracking**: Real-time donation count and percentage completion

## Styling System
- **Tailwind CSS** with custom color palette in `tailwind.config.js`:
  - `wood`: #7B5E3B (header backgrounds)
  - `paper`: #F5E9D4 (card backgrounds)  
  - `ink`: #2A2A2A (text)
  - `leaf`: #3CA370 (progress bars, success states)
  - `ocean`: #1A2B4A (accent)
  - `cube`: #6E5AA3 (accent)
- **Google Fonts**: Varela Round loaded in `index.html`
- **Parchment aesthetic**: Gradients and subtle grain overlays

## MVP Scope Constraints
This is intentionally a minimal MVP focused solely on fish donation tracking:
- No PWA features, tip jars, or item detail pages
- No navigation or multi-page structure
- No user accounts or cloud sync
- GameCube-only fish species (no other Animal Crossing games)

## Data Re-extraction
When fish data needs updating, run `npm run extract-data` which:
1. Searches the Swift repository for fish definitions
2. Applies month/habitat parsing and validation
3. Outputs clean JSON to `public/data/acgcn/fish.json`
4. Includes known bell values from AC GameCube research