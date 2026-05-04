# Handoff: v0.9 UI Redesign — "Curator"

## Overview

This is a redesign of the Animal Crossing Museum Tracker for **v0.9** (the UI redesign pass mentioned in `CLAUDE.md` roadmap). The new direction is codenamed **"Curator"** — a softer, more editorial museum aesthetic that keeps the cozy warmth of the parchment/wood palette but lightens density, modernizes typography, and introduces a sectioned list pattern that surfaces seasonal urgency ("leaving soon" / "available now") without burying the player in a flat A–Z list.

## About the Design Files

The files in this bundle (`Curator.html`, `styles.css`, `*.jsx`, `data.js`, `theme.js`) are **design references** — an HTML/React prototype showing the intended look, layout, and interaction patterns. They are **not production code to copy directly**.

Your job is to **recreate this design inside the existing Vite + React 19 + TypeScript + Tailwind v4 + Zustand codebase**, using its established conventions:
- Real Zustand store + `useMuseumData` hook for data (not the static `data.js` here)
- React Router v6 routing for tabs (preserve `/town/:townId/:tab` URL structure)
- TypeScript everywhere; extend `src/lib/types.ts` if you need new fields
- Tailwind utility classes (the prototype uses raw CSS — translate to Tailwind classes + `colors.ts` tokens)
- Existing component split (`MuseumHeader`, `TabBar`, `CollectibleRow`, `ItemExpandPanel`, `HomeTab`, etc.) — refactor in place rather than introducing parallel components

## Fidelity

**High-fidelity.** Colors, type scale, spacing, and interactions are intentional. Recreate pixel-perfectly.

The prototype ships **4 themes** (Meadow / Parchment / Midnight / Sakura) — only **Meadow** is required for v0.9. Parchment is the existing app's palette preserved as a fallback. Midnight + Sakura are bonus directions; ship if you want, otherwise defer.

---

## Screens

### 1. App shell (sidebar + main column)

- **Layout:** CSS grid `280px 1fr`, max-width 1440px, centered. Sidebar is sticky/full-height with its own scroll; main column scrolls with page. Below 980px, sidebar collapses above main column.
- **Sidebar contents (top → bottom):**
  - Brand: monogram circle (38×38) + "Curator" wordmark (Fraunces 20/600) + "a museum companion" italic sub
  - Active town card: `surface` bg, 1px border, 14px radius, 14×16 padding. Eyebrow ("ACTIVE TOWN" 10px upper, letter-spacing 0.08em, `ink-muted`), town name (Fraunces 22/500), meta line ("New Horizons · Hem. NH" 12px `ink-soft`), "Switch town ›" link 12px `accent-ink`
  - Nav: vertical list, 1px gap. Each item is a button with label left + count right (`donated/total` in tabular-nums, dimmed slash). Active state: `accent-soft` bg + `accent-ink` text + 500 weight + 9px radius. Hover: `surface-alt` bg.
  - Foot links (Export CSV, Settings) pushed to bottom, 1px top border.
- **Main column padding:** 32px 48px 80px

### 2. Topbar (above all main views)

- Search bar (left, max 380px): search icon SVG + bordered pill input. Placeholder rotates by tab ("Search across categories…" on home, "Search fish…" on category).
- Date chip (right): "Sat **May 2**" — pill with day-of-week regular + date in Fraunces 500 ink.

### 3. Home tab

- **Hero:**
  - Eyebrow: "AVAILABLE IN MAY"
  - Headline: Fraunces 38/400, line-height 1.15, letter-spacing -0.02em, max-width 720px. Pattern: `<em>{stillNeeded}</em> creatures still to donate this month.<br><span class="aside">{leavingSoon} are leaving soon.</span>` — italic accent number in `accent-ink`, line-break before the warn aside (clay color, italic).
- **Month strip:** 12-cell grid in a `surface` rounded card. Each cell shows `01` numeral above `Jan` Fraunces label. Current month cell has `accent-soft` bg + `accent-ink` text + 500 weight on month name.
- **"Leaving end of month" shelf:** eyebrow in `warn` color, Fraunces title "Catch these before May ends", count on right in big Fraunces. Cards grid: 3 columns, each card has tinted monogram glyph (44×44 with diagonal stripe pattern), name + meta + month-dots strip + warn ⚠ icon.
- **"Just arrived" shelf:** same card pattern, no warn icon.
- **Latest donations:** rounded `surface` card, list rows with category dot + item name + category eyebrow + relative time.

### 4. Category tabs (Fish / Bugs / Fossils / Art)

- **Header:** `<em>{donated}</em> of {total} {category}` — Fraunces 44/400, italic accent number. Right side: `{pct}% complete` strong + helper text ("Showing availability for May") for time-sensitive categories.
- **Sectioned list — groups appear only when non-empty, in this order:**
  1. **Leaving this month** (warn-toned eyebrow)
  2. **Available now** (accent-toned eyebrow)
  3. **Out of season** (muted eyebrow)
  4. **Already donated** (muted eyebrow)
- **Group head:** uppercase 11px / 600 / 0.12em letter-spacing, count right-aligned 12px tabular.
- **List card:** `surface` bg, 1px border, 12px radius, divider lines between rows.
- **Item row:**
  - Glyph (32×32 rounded square, 1.5px category-tinted border, Fraunces monogram letters; **donated** state fills bg with category tint and inverts text to `surface`)
  - Name (500 weight) + small ● checkmark in `accent` if donated; **donated rows strike through name** with `border-strong` 1px decoration
  - Meta line: `habitat · value ✦` (or `location · value` for bugs, `part · value` for fossils, italic `basedOn` for art) — separators use `·` glyph in `border-strong`, 8px each side
  - Right side: `Leaving soon` warn pill OR `New this month` accent pill (only when not donated), time text "4pm–9am" if not "all day", chevron ›
  - Hover: `surface-alt` bg. Expanded: same.
- **Expand panel** (inline accordion, opens when row clicked):
  - Two-column grid `1fr 240px`, padding `4px 18px 22px 64px` (left-pad aligns with row text), `surface-alt` bg, 1px top border
  - Left: "Available in" eyebrow + 12-cell month grid. Cells are square, 6px radius. Available months: `accent-soft` bg + `accent` border. Current month: 1.5px inset accent ring + 600 label.
  - Right column: stats stack — bells value (Fraunces 22/500), shadow size, active hours; optional `notes` quote-block (`accent`-bordered left). Donate button at bottom: `accent` bg / `surface` text → flips to outlined "Donated ✓ — undonate" when on.
  - Chevron rotates 90° when expanded.

### 5. Stats tab

- Header: `<em>Stats</em> & rhythms` (Fraunces 44/400)
- 4-up category cards: eyebrow in category color, big donated/total Fraunces, thin progress bar tinted with category color, "X% complete" caption
- Yearly rhythm chart: 12 columns, each with a stacked bar. BG height = % of max availability across all months. Inner fill (50% accent opacity) = donated fraction within available. Current month column has accent border. Number above each column = how many available that month. Legend: "Available" / "Already donated"

### 6. Item detail (inline expand)

Same as the expand panel described in section 4. **No bottom sheet, no separate modal** for fish/bugs/fossils. Art still uses `DetailModal` per existing code; the row treatment is the same up to the expand point.

---

## Interactions

- **Tab switch:** instant. URL updates per existing React Router setup.
- **Row click:** toggles inline expand. Only one row open at a time per category (state lives in CategoryTab).
- **Donate toggle:** `e.stopPropagation()` so the donate button doesn't also collapse the expand. Updates Zustand store.
- **Search:** debounced 150ms (existing `useSearch` hook is fine). Filters within the active category for category tabs; on home it's the global search trigger.
- **Hide donated tweak:** filters category lists to omit items in the `donated[cat]` set. Already-donated section disappears.
- **Month slider:** for prototyping only — production should always use `new Date().getMonth() + 1`.
- **Hover transitions:** 0.12s on row bg, card border, donate button opacity. Chevron rotation: 0.18s.

---

## Design Tokens

All values in `theme.js` → port to `src/lib/colors.ts` and Tailwind `theme.extend`. Add a new theme object `meadow` alongside the existing `colors` export; keep `colors` (parchment) intact as fallback.

### Meadow palette (default)

| token | value | usage |
|---|---|---|
| `bg` | `#F4EFE3` | page background |
| `surface` | `#FFFDF7` | card backgrounds |
| `surface-alt` | `#F8F2E2` | hover, expand panel, secondary surfaces |
| `ink` | `#23241F` | primary text |
| `ink-soft` | `#5C5848` | secondary text |
| `ink-muted` | `#8A8470` | tertiary text, eyebrows |
| `border` | `#E2D9C3` | subtle borders, dividers |
| `border-strong` | `#CFC4A8` | hover borders, separator dots, strikethrough |
| `accent` | `oklch(0.55 0.09 150)` | primary moss green — buttons, progress bars |
| `accent-soft` | `oklch(0.55 0.09 150 / 0.12)` | nav active, accent pill bg, current-month bg |
| `accent-ink` | `oklch(0.32 0.06 150)` | accent text on light bg |
| `warn` | `oklch(0.62 0.12 50)` | clay — leaving-soon |
| `warn-soft` | `oklch(0.62 0.12 50 / 0.14)` | warn pill bg |
| `chip-fish` | `oklch(0.62 0.08 230)` | fish category tint |
| `chip-bugs` | `oklch(0.6 0.1 130)` | bugs category tint |
| `chip-fossils` | `oklch(0.55 0.06 60)` | fossils category tint |
| `chip-art` | `oklch(0.58 0.08 320)` | art category tint |

### Typography

- **Display:** `'Fraunces', Georgia, serif` — 9..144 opsz axis. Weights 400/500/600. Use italic 400/500 for accents.
- **UI:** `'Inter', system-ui, sans-serif` — weights 400/500/600/700.
- Replace `Varela Round` global rule in `src/index.css`. Load both via Google Fonts (already shown in `styles.css` `@import` URL).

### Type scale

| usage | font / size / weight / lh / tracking |
|---|---|
| Hero headline | Fraunces 38 / 400 / 1.15 / -0.02em |
| Category h1 | Fraunces 44 / 400 / 1.0 / -0.02em |
| Card / shelf title | Fraunces 24 / 500 / 1.2 / -0.01em |
| Section eyebrow | Inter 11 / 600 / 1.4 / 0.12em uppercase |
| Body | Inter 14 / 400 / 1.5 / -0.005em |
| Row name | Inter 14 / 500 |
| Row meta | Inter 12 / 400 |
| Stat value | Fraunces 22 / 500 / -0.01em |
| Tabular numbers | `font-variant-numeric: tabular-nums` everywhere counts/values appear |

### Spacing & radii

- Card radius: **12px** (lists, stat cards), **14px** (hero cards, town card)
- Pill radius: **999px**
- Button radius: **8px**, glyph: **8–10px**
- Section gaps: 36px between hero/shelves/groups; 28px between groups
- Sidebar padding: 28×22; main padding: 32×48 (24×20 mobile)

### Shadows

None — borders carry separation. Hover lift is `transform: translateY(-1px)` + border color change, no shadow.

---

## State Management

No new store fields required. Reuses existing schema:
- `donated[townId][gameId][itemId]` — per `CLAUDE.md` v3 schema
- `Town.hemisphere` — already exists
- Active month: `new Date().getMonth() + 1` derived in component, **not** stored

New UI state (component-local, not persisted):
- `expanded: string | null` per CategoryTab
- `search: string` lifted to App or per-tab
- Optional Zustand: `viewPrefs.hideDonated: boolean` if you want the toggle persistent

---

## Assets

- **Fonts:** Fraunces + Inter via Google Fonts (`https://fonts.googleapis.com/css2?...`)
- **No item sprites.** The prototype uses 2-letter monograms because real AC sprites are copyrighted. If your existing app already has acceptable item imagery, swap glyphs for those — just preserve the 32×32 / 44×44 frame and category-tinted border treatment.
- **Brand mark:** the museum-roof SVG in the sidebar is in `shell.jsx` — `<svg viewBox="0 0 32 32">…</svg>`. Lift it directly.
- **Icons:** search icon is inline SVG in `Curator.html`. Use Lucide or your existing icon set if you have one.

---

## Files in this bundle

| file | what's in it |
|---|---|
| `Curator.html` | Entry point — App component, theme application, Tweaks panel wiring |
| `styles.css` | All visual styling. Read this for exact CSS values. |
| `theme.js` | All 4 theme palettes as JS objects |
| `data.js` | Sample museum data (NOT representative of full datasets — you have the real JSON in `public/data/`) |
| `shell.jsx` | Sidebar, MonthStrip, ProgressMeter |
| `tabs.jsx` | HomeTab, CategoryTab, StatsTab |
| `components.jsx` | ItemRow, Glyph, Pill, MonthDots, MonthGrid |
| `tweaks-panel.jsx` | Prototype-only tweaks UI; not for prod |

---

## Migration plan suggestion (in priority order)

1. **Tokens & fonts** — extend `colors.ts` with meadow palette, swap Varela Round for Fraunces+Inter in `index.css`, set up Tailwind colors so utility classes work.
2. **App shell** — replace `MuseumHeader` + horizontal `TabBar` with sidebar nav. Keep React Router routes intact; the sidebar just renders `<NavLink>`s.
3. **CollectibleRow** — restyle to match new row spec (glyph, meta line with `·` separators, donated strikethrough, pill states).
4. **ItemExpandPanel** — restyle to two-column grid layout, add stat stack on right, donate button at bottom.
5. **HomeTab** — rebuild with hero + month strip + leaving/new shelves. The "leaving soon" filter logic is in `tabs.jsx` (`HomeTab` function, `leavingSoon` array).
6. **AnalyticsView (Stats)** — new card grid + monthly availability chart.
7. **Polish** — animations, mobile responsive pass, settings/onboarding (per v0.9 roadmap).
