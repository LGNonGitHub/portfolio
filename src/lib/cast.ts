/**
 * The cast phase: one attribute on <html> that every part of the intro reads.
 *
 *   play       the summoning circle is on screen and the page behind it is
 *              sealed (inert, scroll locked)
 *   departing  the circle has broken apart and its pieces are flying to their
 *              homes on the page; the overlay is transparent
 *   done       the page is live
 *
 * It lives on the DOM rather than in React state because the first value is
 * written by the theme script in layout.tsx before the first paint, and CSS
 * (src/styles/prologue.css) has to act on it before any JavaScript has
 * hydrated. React and the GL stage read it from here, through
 * useCastPhase().
 *
 * Anything that is not the home page, a repeat visit in the same tab, reduced
 * motion and 静 stillness all start at 'done', so they never see the intro.
 */

export type CastPhase = 'play' | 'departing' | 'done';

/** Fired on window whenever the phase changes; detail is the new phase. */
export const CAST_EVENT = 'cast:phase';

const isPhase = (v: unknown): v is CastPhase =>
  v === 'play' || v === 'departing' || v === 'done';

/**
 * The current phase. Defaults to 'done' on the server, and whenever the
 * attribute is missing or garbled: a broken value must never hold the page
 * behind the intro.
 */
export function getCastPhase(): CastPhase {
  if (typeof document === 'undefined') return 'done';
  const v = document.documentElement.dataset.cast;
  return isPhase(v) ? v : 'done';
}

export function setCastPhase(phase: CastPhase) {
  if (typeof document === 'undefined') return;
  if (document.documentElement.dataset.cast === phase) return;
  document.documentElement.dataset.cast = phase;
  window.dispatchEvent(new CustomEvent<CastPhase>(CAST_EVENT, { detail: phase }));
}
