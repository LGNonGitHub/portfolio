import { galaxy, TILT_SQUASH, type Star } from '@/lib/galaxy';
import { cn } from '@/lib/utils';

/**
 * The hero's sigil when the GL stage is not drawing it: the same twin-arm
 * galaxy (src/lib/galaxy.ts), as SVG.
 *
 * Every star of a kind goes into one path of zero-length segments with round
 * caps, so ~400 stars are five DOM nodes rather than four hundred — this sits
 * in the hero on every load, and DOM size is most of what the page's style
 * recalc costs. Strokes are non-scaling so the dots stay round under the
 * tilt's squash and stay star-sized whether the slot is 720px or 112vw.
 *
 * The disc spins in CSS (stage.css), inside the squash, so it turns as a
 * tilted disc rather than as a spinning ellipse. Stillness and reduced
 * motion stop it.
 */
const STARS = galaxy(420, 11);
const R = 188;

const d = (stars: Star[]) =>
  stars.map((s) => `M${(s.x * R).toFixed(1)} ${(s.y * R).toFixed(1)}h0`).join('');

const bright = (s: Star) => s.b > 0.95;
const ARM0 = STARS.filter((s) => s.arm === 0);
const ARM1 = STARS.filter((s) => s.arm === 1);
const PATHS = [
  { d: d(ARM0.filter(bright)), w: 3, o: 0.95, c: 'stroke-accent' },
  { d: d(ARM0.filter((s) => !bright(s))), w: 1.8, o: 0.6, c: 'stroke-accent' },
  { d: d(ARM1.filter(bright)), w: 3, o: 0.95, c: 'stroke-accent-2' },
  { d: d(ARM1.filter((s) => !bright(s))), w: 1.8, o: 0.6, c: 'stroke-accent-2' },
  { d: d(STARS.filter((s) => s.arm === 'core')), w: 3.2, o: 0.9, c: 'stroke-fg' },
];

export function GalaxySigil({ className }: { className?: string }) {
  return (
    <svg viewBox="-200 -200 400 400" aria-hidden className={cn('overflow-visible', className)}>
      <g transform={`scale(1 ${TILT_SQUASH.toFixed(3)})`}>
        <g className="galaxy-spin">
          {PATHS.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill="none"
              strokeWidth={p.w}
              strokeOpacity={p.o}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className={p.c}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
