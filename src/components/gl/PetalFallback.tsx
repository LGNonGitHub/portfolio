'use client';

/**
 * Fragrant Flower's petals, for visitors without the GPU stage.
 *
 * The old Petals.tsx was a perpetual full-viewport 2D canvas that polled the
 * palette with MutationObserver and getComputedStyle, which is why it was
 * measured running a section behind. This is eight inline SVG petals animated
 * with transforms only, scoped to Contact, and switched off entirely the
 * moment the GL stage takes over — where the petals belong to the flower
 * rather than to the whole page.
 */

const PETALS = [
  { left: 6, delay: 0, dur: 18, size: 16 },
  { left: 18, delay: 4, dur: 21, size: 12 },
  { left: 31, delay: 9, dur: 15, size: 18 },
  { left: 44, delay: 2, dur: 22, size: 11 },
  { left: 58, delay: 11, dur: 17, size: 15 },
  { left: 70, delay: 6, dur: 20, size: 13 },
  { left: 82, delay: 14, dur: 16, size: 17 },
  { left: 92, delay: 8, dur: 19, size: 12 },
];

export function PetalFallback() {
  return (
    <div className="petal-fallback" aria-hidden>
      {PETALS.map((p, i) => (
        <svg
          key={i}
          className="petal-fallback__petal"
          width={p.size}
          height={p.size * 1.6}
          viewBox="0 0 10 16"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.dur}s`,
            animationDelay: `-${p.delay}s`,
          }}
        >
          <ellipse cx="5" cy="8" rx="4" ry="7.5" fill="rgb(var(--accent) / 0.35)" />
        </svg>
      ))}
    </div>
  );
}
