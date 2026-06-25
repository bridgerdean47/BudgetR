// src/lib/themes.js
// Each theme's colors are "r g b" triplets so Tailwind's
// rgb(var(--x) / <alpha-value>) pattern can apply opacity modifiers
// (e.g. bg-accent/10) the same way literal Tailwind colors do.

const darkNeutrals = {
  bg: "5 5 7",
  surface: "13 13 16",
  border: "38 38 45",
  fg: "245 245 247",
  fgMuted: "156 163 175",
  fgSubtle: "107 114 128",
};

export const THEMES = [
  {
    id: "midnight",
    label: "Midnight",
    mode: "dark",
    vars: {
      ...darkNeutrals,
      accent: "99 102 241",
      heroFrom: "79 70 229",
      heroTo: "37 99 235",
    },
  },
  {
    id: "emerald",
    label: "Emerald",
    mode: "dark",
    vars: {
      ...darkNeutrals,
      accent: "16 185 129",
      heroFrom: "5 150 105",
      heroTo: "13 148 136",
    },
  },
  {
    id: "violet",
    label: "Violet",
    mode: "dark",
    vars: {
      ...darkNeutrals,
      accent: "139 92 246",
      heroFrom: "124 58 237",
      heroTo: "79 70 229",
    },
  },
  {
    id: "amber",
    label: "Amber",
    mode: "dark",
    vars: {
      ...darkNeutrals,
      accent: "245 158 11",
      heroFrom: "217 119 6",
      heroTo: "234 88 12",
    },
  },
  {
    id: "crimson",
    label: "Crimson",
    mode: "dark",
    vars: {
      ...darkNeutrals,
      accent: "239 68 68",
      heroFrom: "220 38 38",
      heroTo: "190 24 93",
    },
  },
  {
    id: "daylight",
    label: "Daylight",
    mode: "light",
    vars: {
      bg: "247 247 248",
      surface: "255 255 255",
      border: "229 231 235",
      fg: "17 24 39",
      fgMuted: "75 85 99",
      fgSubtle: "107 114 128",
      accent: "37 99 235",
      heroFrom: "37 99 235",
      heroTo: "2 132 199",
    },
  },
];

export const DEFAULT_THEME_ID = "midnight";

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function themeToCssVars(vars) {
  return {
    "--color-bg": vars.bg,
    "--color-surface": vars.surface,
    "--color-border": vars.border,
    "--color-fg": vars.fg,
    "--color-fg-muted": vars.fgMuted,
    "--color-fg-subtle": vars.fgSubtle,
    "--color-accent": vars.accent,
    "--color-hero-from": vars.heroFrom,
    "--color-hero-to": vars.heroTo,
  };
}
