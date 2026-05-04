# Curator v0.9.2 — pass 3 delta

Three design items resolved on top of v0.9.1. **Read v0.9 + v0.9.1 READMEs first** for the foundational design language; this doc only covers what's new.

---

## 1. ProgressMeter — 5-segment for ACNL/ACNH

**File:** `shell.jsx` → `ProgressMeter`

Now derives its segment list from `gameId`:
- ACGCN / ACWW / ACCF → 4 segments (fish, bugs, fossils, art)
- ACNL / ACNH → **5 segments** (+ sea, color `--chip-sea`)

Both the segment fill **and** the label-row dot use `--chip-sea` — confirmed.

### Responsive behavior

The 5-segment bar is tighter, so we shed details progressively as width drops. Container width here = the main content column (sidebar adds ~248px).

| Viewport | 5-seg behavior |
|---|---|
| ≥1180px | Full labels: dot · name · `n/total` fraction. 8px gap (vs. 10px on 4-seg). |
| 980–1180px | Drop the fractions; keep dot + name. Tighter padding (7px 8px). |
| ≤980px | **Wrap to 2 rows**: 2.5 segments per row at `flex-basis: calc(50% - 3px)`. Fractions return because there's room again. |

Implemented as `.ac-meter-5` modifier class; 4-seg is unchanged.

### What to verify

- [ ] At ~1280px viewport: 5 labels read cleanly, sea dot uses `--chip-sea`.
- [ ] At ~1100px: fractions hidden, names + dots stay legible.
- [ ] At mobile (~390px): 5 segments wrap to 2 rows, visually balanced.

---

## 2. Scroll-to + highlight on jump

**Files:** `components.jsx` (`ItemRow`), `tabs.jsx` (`CategoryTab`), `Curator.html` (App)

### Spec

When a Home shelf card or global search result is clicked, the target row is:
1. **Scrolled into view** — `scrollIntoView({ behavior: 'smooth', block: 'center' })`
2. **Auto-expanded** — the inline detail panel opens, so the user sees full context (months, value, donate button) without a second click.
3. **Highlighted** — `accent-soft` background pulse via the `.ac-row-pulse` keyframe, **1.4s ease-out**, then fades to the row's normal expanded background (`--surface-alt`).

Behavior is identical on mobile (≤980px). Smooth scroll + 1.4s pulse work fine at small widths; no separate codepath needed.

### Wiring

- `App` owns `highlightId` state.
- Setters: `jumpTo(cat, id)` (Home cards) and `onJump` in `GlobalSearchDropdown` both `setTab(cat) + setHighlightId(id)`.
- `CategoryTab` receives `highlightId` + `onHighlightConsumed`. On change, it sets `expanded = highlightId`, waits a frame for the row to render, then queries `[data-row-id="…"]`, scrolls + adds `.ac-row-pulse`, and clears the parent state via `onHighlightConsumed` so re-clicking the same item triggers the effect again.
- `ItemRow` now stamps `data-row-id={item.id}` on its outer div.

### CSS

```css
.ac-row-pulse > .ac-row-main { animation: ac-row-pulse 1.4s ease-out; }
@keyframes ac-row-pulse {
  0%   { background: var(--accent-soft); }
  60%  { background: color-mix(in oklch, var(--accent) 16%, transparent); }
  100% { background: var(--surface-alt); }
}
```

---

## 3. Settings page

**File:** `addons.jsx` → `SettingsPage`. Styles in `addons-styles.css`.

### Navigation pattern

**Full-page route inside the main column** — not a modal, not a drawer. When `settingsOpen=true`, the main column renders `<SettingsPage>` instead of the active tab. The sidebar stays in place (active town card + nav still visible), and any tab click closes settings via `onTab` in `Curator.html`.

Why full-page over modal/drawer:
- Theme cards need horizontal real estate (4-up grid at desktop).
- Danger zone needs breathing room — destructive actions deserve calm typography, not a cramped modal footer.
- About / version info reads naturally as a top-level "page" the same way Stats does.
- `Esc` still closes (consistent with modal expectation), bound inside `SettingsPage`.

Activated by the **Settings** link in the sidebar footer.

### Sections (in order)

**1. Appearance — Theme switcher**

Visual treatment: **swatch cards** (4-up auto-fill grid). Each card:
- 76px swatch row showing `surface · bg · accent · chipFish` to give a real preview.
- Name + 1-line subtitle ("Default — moss + cream", "Cozy paper + wood", etc.).
- Active state: `--accent` border + 3px `--accent-soft` halo + `●` checkmark next to the name.

Selection persists via the existing Tweaks `theme` key — `onThemeChange={(v) => setTweak("theme", v)}`. No new persistence layer.

I picked swatch cards over a segmented control or radio list because:
- Themes are visual; a list of words ("Meadow / Parchment / …") doesn't preview the change.
- Cards scale gracefully — adding a 5th theme later doesn't blow up the layout.
- Matches Curator's "cards on a soft surface" language elsewhere (shelf cards, town cards, stat cards).

**2. About**

Plain dl/dt/dd list inside a single card:
- Version (v0.9.2-alpha · Curator)
- Source (GitHub link, opens in new tab)
- Storage (live: town count + total donations)
- Credits ("Companion app for the Animal Crossing series. Not affiliated with Nintendo.")

**3. Danger zone**

Red-tinted card (`oklch(0.62 0.12 25)` family). Two actions stacked:
- **Reset donations for active town** — quiet ghost button. Confirms via native `confirm()`. Real implementation should use a styled confirm dialog.
- **Reset everything** — solid red button. Wipes towns, donations, and search history.

Both actions in the demo go through `confirm()` placeholders; production should wire a proper styled confirm dialog (out of scope for this design pass).

### Responsive

- Theme grid auto-fills `minmax(200px, 1fr)`, collapses cleanly on phones.
- About list switches to single column at ≤700px.
- Danger rows stack with full-width buttons at ≤700px.
- Title shrinks 56→40px.

---

## Confirmations applied

- **GlobalSearchDropdown** now includes a 5th `sea` group, same row treatment as the others. Empty group is hidden, like before.
- **`basedOn` matching** confirmed in the existing search filter (`it.basedOn.toLowerCase().includes(q)`) — "Leonardo" surfaces *Famous Painting*. No change needed.
- **`playerName`** — was never referenced in the v0.9 design. Safe to deprecate from the Town type without touching the design files.

---

## Files changed in this pass

| File | What changed |
|---|---|
| `shell.jsx` | `ProgressMeter` now takes `gameId`, renders 4 or 5 segments accordingly |
| `tabs.jsx` | `HomeTab` accepts `gameId` and passes through; `CategoryTab` accepts `highlightId` + handles scroll/expand/pulse effect; sea is included in shelves for ACNH/ACNL |
| `components.jsx` | `ItemRow` stamps `data-row-id` for scroll targeting |
| `addons.jsx` | `GlobalSearchDropdown` extended to include sea; new `SettingsPage` component |
| `Curator.html` | App owns `highlightId` + `settingsOpen` state; wires `jumpTo` + sidebar Settings link |
| `styles.css` | `.ac-meter-5` responsive rules; `.ac-row-pulse` keyframe |
| `addons-styles.css` | All Settings page styles |

No data shape changes. No new dependencies.
