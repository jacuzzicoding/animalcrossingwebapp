// Theme tokens. Exposed as CSS variables on :root via setTheme().
window.THEMES = {
  meadow: {
    label: "Meadow",
    bg: "#F4EFE3",
    surface: "#FFFDF7",
    surfaceAlt: "#F8F2E2",
    ink: "#23241F",
    inkSoft: "#5C5848",
    inkMuted: "#8A8470",
    border: "#E2D9C3",
    borderStrong: "#CFC4A8",
    accent: "oklch(0.55 0.09 150)", // moss
    accentSoft: "oklch(0.55 0.09 150 / 0.12)",
    accentInk: "oklch(0.32 0.06 150)",
    warn: "oklch(0.62 0.12 50)", // clay
    warnSoft: "oklch(0.62 0.12 50 / 0.14)",
    chipFish: "oklch(0.62 0.08 230)",
    chipBug: "oklch(0.6 0.1 130)",
    chipFossil: "oklch(0.55 0.06 60)",
    chipArt: "oklch(0.58 0.08 320)",
    fontDisplay: "'Fraunces', 'Playfair Display', Georgia, serif",
    fontUi: "'Inter', system-ui, -apple-system, sans-serif",
  },
  parchment: {
    label: "Parchment (current)",
    bg: "#EFE6D0",
    surface: "#F5E9D4",
    surfaceAlt: "#EADCBE",
    ink: "#2A2A2A",
    inkSoft: "#5a4a35",
    inkMuted: "#8B7A5C",
    border: "#E0D2B0",
    borderStrong: "#C9B98D",
    accent: "#3CA370",
    accentSoft: "rgba(60,163,112,0.14)",
    accentInk: "#1F5A3C",
    warn: "#C76B3F",
    warnSoft: "rgba(199,107,63,0.16)",
    chipFish: "#3F6FA8",
    chipBug: "#7B9C3A",
    chipFossil: "#7B5E3B",
    chipArt: "#8B5E94",
    fontDisplay: "'Varela Round', system-ui, sans-serif",
    fontUi: "'Varela Round', system-ui, sans-serif",
  },
  midnight: {
    label: "Midnight",
    bg: "#16181F",
    surface: "#1E212A",
    surfaceAlt: "#262A35",
    ink: "#EFEAE0",
    inkSoft: "#B5AE9E",
    inkMuted: "#7E7866",
    border: "#2F3340",
    borderStrong: "#3D4250",
    accent: "oklch(0.7 0.09 150)",
    accentSoft: "oklch(0.7 0.09 150 / 0.16)",
    accentInk: "oklch(0.85 0.06 150)",
    warn: "oklch(0.72 0.12 50)",
    warnSoft: "oklch(0.72 0.12 50 / 0.18)",
    chipFish: "oklch(0.72 0.09 230)",
    chipBug: "oklch(0.74 0.09 130)",
    chipFossil: "oklch(0.7 0.06 60)",
    chipArt: "oklch(0.72 0.08 320)",
    fontDisplay: "'Fraunces', Georgia, serif",
    fontUi: "'Inter', system-ui, sans-serif",
  },
  sakura: {
    label: "Sakura",
    bg: "#FBF0EE",
    surface: "#FFFCFB",
    surfaceAlt: "#F7E5E1",
    ink: "#2C2228",
    inkSoft: "#705661",
    inkMuted: "#9C8590",
    border: "#EFD9D3",
    borderStrong: "#DEBDB4",
    accent: "oklch(0.6 0.11 10)", // rose
    accentSoft: "oklch(0.6 0.11 10 / 0.12)",
    accentInk: "oklch(0.4 0.09 10)",
    warn: "oklch(0.6 0.13 50)",
    warnSoft: "oklch(0.6 0.13 50 / 0.14)",
    chipFish: "oklch(0.6 0.08 230)",
    chipBug: "oklch(0.6 0.09 130)",
    chipFossil: "oklch(0.55 0.06 60)",
    chipArt: "oklch(0.58 0.08 320)",
    fontDisplay: "'Fraunces', Georgia, serif",
    fontUi: "'Inter', system-ui, sans-serif",
  },
};

window.applyTheme = function applyTheme(name) {
  const t = window.THEMES[name] || window.THEMES.meadow;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t)) {
    if (k === "label") continue;
    root.style.setProperty(`--${k.replace(/([A-Z])/g, "-$1").toLowerCase()}`, v);
  }
  root.dataset.theme = name;
};
