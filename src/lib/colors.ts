/** Design token hex values — single source of truth for all inline styles */
export const colors = {
  wood: '#7B5E3B', // header/section backgrounds
  paper: '#F5E9D4', // card backgrounds
  ink: '#2A2A2A', // primary text
  leaf: '#3CA370', // progress bars, success states
  border: '#E7DAC4', // borders
  muted: '#5a4a35', // secondary/muted text
} as const;

/**
 * Meadow theme tokens (v0.9). Mirrors the CSS custom properties defined in
 * `src/index.css` `@theme` block. Use the CSS vars (`var(--accent)`) for
 * styling; this export exists for cases where a JS literal is required.
 *
 * Color values match the locked palette in docs/v0.9-plan.md §5.
 */
export const meadow = {
  bg: '#F4EFE3',
  surface: '#FFFDF7',
  surfaceAlt: '#F8F2E2',
  ink: '#23241F',
  inkSoft: '#5C5848',
  inkMuted: '#8A8470',
  border: '#E2D9C3',
  borderStrong: '#CFC4A8',
  accent: 'oklch(0.55 0.09 150)',
  accentSoft: 'oklch(0.55 0.09 150 / 0.12)',
  accentInk: 'oklch(0.32 0.06 150)',
  warn: 'oklch(0.62 0.12 50)',
  warnSoft: 'oklch(0.62 0.12 50 / 0.14)',
  chipFish: 'oklch(0.62 0.08 230)',
  chipBugs: 'oklch(0.6 0.1 130)',
  chipFossils: 'oklch(0.55 0.06 60)',
  chipArt: 'oklch(0.58 0.08 320)',
  chipSea: 'oklch(0.58 0.09 200)',
} as const;

export const fontStacks = {
  display: "'Fraunces', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
} as const;
