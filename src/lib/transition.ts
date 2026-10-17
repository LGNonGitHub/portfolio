/**
 * Palette changes as a cut, not a fade.
 *
 * The theme and the 剣/杖 duality each repaint the whole page. Through a View
 * Transition the new palette is revealed over the old one from the button
 * that was pressed: the theme as a circle opening from the toggle, the sword
 * as a diagonal slash, the wand as a bloom. Anime cuts between scenes the same
 * way; a 700 ms crossfade of every colour on the page reads as a glitch.
 *
 * Falls back to a plain, instant update when the browser has no View
 * Transitions, when the visitor prefers reduced motion, or under 静.
 */
import { flushSync } from 'react-dom';
import { runtime } from '@/lib/runtime';
import { EASE_OUT, cssEase } from '@/lib/motion';

export type TransitionKind = 'theme' | 'sword' | 'wand';
export type Origin = { x: number; y: number };

const DURATION = 520;

/** Radius that just reaches the farthest corner, so the reveal finishes exactly
 *  as it covers the screen instead of spending its tail off-screen. */
function coverRadius({ x, y }: Origin) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
}

function clipFrames(kind: TransitionKind, origin: Origin): [string, string] {
  if (kind === 'sword') {
    // Equal vertex counts on both frames, so the polygon interpolates: a blade
    // edge enters from the left and sweeps across on a slant.
    return [
      'polygon(-20% 0, -20% 0, -40% 100%, -40% 100%)',
      'polygon(-20% 0, 140% 0, 120% 100%, -40% 100%)',
    ];
  }
  const at = `at ${Math.round(origin.x)}px ${Math.round(origin.y)}px`;
  return [`circle(0px ${at})`, `circle(${Math.ceil(coverRadius(origin))}px ${at})`];
}

/** The centre of an element, for passing as an origin. */
export function centreOf(el: Element | null | undefined): Origin {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function withTransition(update: () => void, kind: TransitionKind, origin: Origin) {
  const doc = document as Document & {
    startViewTransition?: Document['startViewTransition'];
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof doc.startViewTransition !== 'function' || reduced || runtime.get().motion === 'still') {
    update();
    return;
  }

  // flushSync so React has committed the new state (the sun/moon icon, the
  // 剣/杖 glyph) before the browser snapshots the "after" frame.
  const transition = doc.startViewTransition(() => flushSync(update));
  const [from, to] = clipFrames(kind, origin);

  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [from, to] },
        {
          duration: DURATION,
          easing: cssEase(EASE_OUT),
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    // A skipped transition (another toggle mid-flight, a hidden tab) rejects
    // these. The update itself has still been applied, so there is nothing to
    // recover; just keep the rejection out of the console.
    .catch(() => {});
  transition.finished.catch(() => {});
  transition.updateCallbackDone.catch(() => {});
}
