import type { Theme } from './types/index.js';

// ─── Palette colour constants ──────────────────────────────────────────────────

/** Particle colour arrays per palette id (used by tsParticles in main.ts). */
export const PALETTE_COLOURS: Record<string, string[]> = {
  violet: ['#a855f7', '#7c3aed', '#e11d48', '#f97316'],
  ocean: ['#22d3ee', '#0369a1', '#2dd4bf', '#06b6d4'],
  warm: ['#f59e0b', '#d97706', '#fb923c', '#dc2626'],
  rose: ['#f43f5e', '#db2777', '#c084fc', '#fb923c'],
  forest: ['#4ade80', '#22c55e', '#2dd4bf', '#86efac'],
};

/** All recognised palette ids. */
export const PALETTE_IDS = ['violet', 'ocean', 'warm', 'rose', 'forest'] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

/** Extracts the palette id from a full Theme string (e.g. "dark-ocean" → "ocean"). */
export function getPaletteId(theme: string): PaletteId {
  for (const id of PALETTE_IDS) {
    if (theme === id || theme.endsWith(`-${id}`)) return id;
  }
  return 'violet';
}

/** Returns the mode portion of a Theme string ("light" | "dark"). */
export function getThemeMode(theme: Theme): 'light' | 'dark' {
  return theme.startsWith('dark') ? 'dark' : 'light';
}

/** Returns the palette portion of a Theme string. */
export function getThemePalette(theme: Theme): string {
  if (theme === 'light' || theme === 'dark') return 'violet';
  return theme.replace(/^(light|dark)-/, '');
}

/** Toggles the mode of a Theme while preserving the palette. */
export function flipThemeMode(theme: Theme, mode: 'light' | 'dark'): Theme {
  const palette = getThemePalette(theme);
  if (palette === 'violet') return mode;
  return `${mode}-${palette}` as Theme;
}

// ─── UI palette metadata ──────────────────────────────────────────────────────

export type PaletteOption = {
  id: string;
  label: string;
  desc: string;
  swatch: string;
};

export const PALETTES: PaletteOption[] = [
  { id: 'violet', label: 'Violeta', desc: 'Roxo · profundo e clássico', swatch: '#8b5cf6' },
  { id: 'ocean', label: 'Oceano', desc: 'Azul · fresco e sereno', swatch: '#0ea5e9' },
  { id: 'warm', label: 'Âmbar', desc: 'Âmbar · quente e aconchegante', swatch: '#f59e0b' },
  { id: 'rose', label: 'Rosa', desc: 'Rosa · vivo e apaixonado', swatch: '#f43f5e' },
  { id: 'forest', label: 'Floresta', desc: 'Verde · natural e sereno', swatch: '#22c55e' },
];
