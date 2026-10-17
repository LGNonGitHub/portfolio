/**
 * Section palettes as data.
 *
 * The same numbers live in CSS (globals.css for the fixed chrome, palettes.css
 * for the per-section subtrees), because CSS needs them before any script runs.
 * They are copied here so canvases and the GPU stage can read a palette
 * without calling getComputedStyle, which is what left the old petals one
 * anime behind. `npm run audit` (palette-parity) fails if the two drift.
 *
 * Every pair clears WCAG AA as text on its own section wash, in both themes.
 */
import type { Accent, SectionId, Theme } from '@/lib/runtime';

export type RGB = readonly [number, number, number];
export type Pair = readonly [RGB, RGB];

export const PALETTES: Record<Theme, Record<SectionId, Pair>> = {
  dark: {
    // Hero and footer: the duality itself, green (剣) and purple (杖).
    prologue: [[60, 214, 140], [162, 118, 255]],
    // Black Clover: crimson and grimoire gold.
    work: [[242, 85, 95], [232, 185, 74]],
    // My Hero Academia: green lightning and hero gold.
    about: [[74, 222, 128], [250, 204, 21]],
    // Wistoria: wand violet and sky.
    stack: [[167, 139, 250], [86, 200, 255]],
    // Sword Art Online: HUD cyan and indigo.
    path: [[34, 211, 238], [129, 140, 248]],
    // The ending: monochrome, so all five series colours can roll past in it.
    hobby: [[237, 235, 243], [158, 152, 176]],
    // Fragrant Flower: blossom pink and lilac.
    contact: [[249, 168, 212], [196, 181, 253]],
  },
  light: {
    prologue: [[22, 110, 70], [88, 44, 170]],
    work: [[176, 30, 43], [122, 92, 12]],
    about: [[21, 128, 61], [161, 98, 7]],
    stack: [[109, 40, 217], [3, 105, 161]],
    path: [[14, 116, 144], [67, 56, 202]],
    hobby: [[40, 34, 52], [84, 78, 98]],
    contact: [[190, 24, 93], [109, 40, 217]],
  },
};

/** Page background per theme (--bg). */
export const BG: Record<Theme, RGB> = {
  dark: [8, 6, 14],
  light: [244, 243, 238],
};

/** The pair in leading order: the 剣/杖 switch swaps which half leads. */
export function pairFor(theme: Theme, section: SectionId, accent: Accent): Pair {
  const [c1, c2] = PALETTES[theme][section];
  return accent === 'purple' ? [c2, c1] : [c1, c2];
}

const hex = (c: RGB) =>
  '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/**
 * The section's background wash as a hex colour: the leading accent mixed into
 * the page background at 9% (dark) or 7% (light), the same mix .motif-field
 * paints with color-mix(). Used for <meta name="theme-color">, so a phone's
 * address bar takes on the section you are reading.
 *
 * The prologue has no wash, so it is the plain background.
 */
export function washHex(theme: Theme, section: SectionId, accent: Accent): string {
  const bg = BG[theme];
  if (section === 'prologue') return hex(bg);
  const [lead] = pairFor(theme, section, accent);
  const t = theme === 'dark' ? 0.09 : 0.07;
  const mix = (i: 0 | 1 | 2) => lead[i] * t + bg[i] * (1 - t);
  return hex([mix(0), mix(1), mix(2)]);
}

/** "r g b" channel string, the form the CSS custom properties use. */
export const channels = (c: RGB) => c.join(' ');
