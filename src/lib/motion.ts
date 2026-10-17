/**
 * The site's motion language, in one place.
 *
 * Every eased move on the page should come from these numbers, so a cast in
 * the intro, a title card writing itself and a nav pill sliding all feel like
 * the same hand. The CSS side mirrors the two curves it needs as
 * `--ease-out` and `--ease-cast` in src/styles/palettes.css.
 */

/** Arrivals: fast out of the gate, a long soft landing. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Casts and wipes: symmetrical, deliberate, for things that travel. */
export const EASE_CAST = [0.65, 0, 0.35, 1] as const;

/** A small overshoot, for things that pop into place (dots, pills). */
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

/** Durations, in seconds (framer's unit). */
export const DUR = {
  /** Feedback: a press, a toggle, a hover. */
  beat: 0.25,
  /** Something moving across the screen. */
  move: 0.55,
  /** Content arriving: a line of type, a plate. */
  reveal: 0.9,
  /** A shape becoming another shape. */
  morph: 1.4,
} as const;

/** Stagger steps, in seconds. */
export const STAGGER = {
  item: 0.04,
  line: 0.08,
  /** One kanji stroke group to the next. */
  glyph: 0.13,
} as const;

/** CSS form of a bezier tuple, for inline styles and WAAPI. */
export const cssEase = (e: readonly [number, number, number, number]) =>
  `cubic-bezier(${e.join(',')})`;
