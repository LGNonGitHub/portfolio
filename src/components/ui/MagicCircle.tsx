'use client';

import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * A layered magic circle: concentric rings, a rotating glyph band, an inscribed
 * polygon and radial ticks. Everything is generated from the `seed` and `points`
 * props rather than drawn by hand, so each instance is distinct but none of it
 * is traced from anyone's artwork.
 *
 * Rings counter-rotate at different speeds, which is what sells it as a
 * summoning sigil rather than a loading spinner.
 */
export function MagicCircle({
  className,
  points = 7,
  seed = 1,
  glyphs = true,
}: {
  className?: string;
  /** Vertices of the inscribed star polygon — odd numbers read best. */
  points?: number;
  seed?: number;
  glyphs?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  // Deterministic pseudo-random so server and client render identically.
  const rand = useMemo(() => {
    let state = seed * 9301 + 49297;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }, [seed]);

  const { star, ticks, runeRing } = useMemo(() => {
    const R = 100;
    const toXY = (angle: number, radius: number) => [
      200 + Math.cos(angle) * radius,
      200 + Math.sin(angle) * radius,
    ];

    // Star polygon: connect every `skip`-th vertex of a regular n-gon.
    const skip = Math.max(2, Math.floor(points / 2));
    const verts = Array.from({ length: points }, (_, i) => {
      const a = (i / points) * Math.PI * 2 - Math.PI / 2;
      return toXY(a, R + 42);
    });
    const order: number[] = [];
    for (let i = 0, v = 0; i < points; i++) {
      order.push(v);
      v = (v + skip) % points;
    }
    const starPath =
      order
        .map((v, i) => `${i === 0 ? 'M' : 'L'} ${verts[v][0].toFixed(2)} ${verts[v][1].toFixed(2)}`)
        .join(' ') + ' Z';

    // Radial tick marks around the outer edge.
    const tickList = Array.from({ length: 72 }, (_, i) => {
      const a = (i / 72) * Math.PI * 2;
      const long = i % 6 === 0;
      const r1 = 168;
      const r2 = long ? 182 : 175;
      const [x1, y1] = toXY(a, r1);
      const [x2, y2] = toXY(a, r2);
      return { x1, y1, x2, y2, long };
    });

    // Glyph band — geometric marks, not borrowed script.
    const marks = ['◇', '✦', '△', '◯', '✧', '▽', '❖', '⬡', '✢', '⟡'];
    const runes = Array.from({ length: 24 }, (_, i) => ({
      char: marks[Math.floor(rand() * marks.length)],
      angle: (i / 24) * 360,
    }));

    return { star: starPath, ticks: tickList, runeRing: runes };
  }, [points, rand]);

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden
      className={cn('overflow-visible', className)}
    >
      <defs>
        <linearGradient id={`mc-grad-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" />
          <stop offset="100%" stopColor="rgb(var(--accent-2))" />
        </linearGradient>
        <radialGradient id={`mc-glow-${uid}`}>
          <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.16" />
          <stop offset="70%" stopColor="rgb(var(--accent-2))" stopOpacity="0.05" />
          <stop offset="100%" stopColor="rgb(var(--accent-2))" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="190" fill={`url(#mc-glow-${uid})`} />

      {/* Outer ring + ticks, slow clockwise */}
      <g className="origin-center animate-spin-slow motion-reduce:animate-none">
        <circle
          cx="200"
          cy="200"
          r="182"
          fill="none"
          stroke={`url(#mc-grad-${uid})`}
          strokeOpacity="0.55"
          strokeWidth="1"
        />
        <circle
          cx="200"
          cy="200"
          r="168"
          fill="none"
          stroke="rgb(var(--accent))"
          strokeOpacity="0.28"
          strokeWidth="0.6"
        />
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="rgb(var(--accent))"
            strokeOpacity={t.long ? 0.6 : 0.25}
            strokeWidth={t.long ? 1.2 : 0.6}
          />
        ))}
      </g>

      {/* Glyph band, counter-rotating */}
      {glyphs && (
        <g className="origin-center animate-spin-reverse motion-reduce:animate-none">
          {runeRing.map((r, i) => (
            <text
              key={i}
              x="200"
              y="52"
              textAnchor="middle"
              fontSize="13"
              fill="rgb(var(--accent-2))"
              fillOpacity="0.5"
              transform={`rotate(${r.angle} 200 200)`}
            >
              {r.char}
            </text>
          ))}
          <circle
            cx="200"
            cy="200"
            r="134"
            fill="none"
            stroke="rgb(var(--accent-2))"
            strokeOpacity="0.3"
            strokeWidth="0.8"
          />
        </g>
      )}

      {/* Inscribed star + inner rings, slow clockwise */}
      <g className="origin-center animate-spin-slow motion-reduce:animate-none">
        <path
          d={star}
          fill="none"
          stroke={`url(#mc-grad-${uid})`}
          strokeOpacity="0.45"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <circle
          cx="200"
          cy="200"
          r="100"
          fill="none"
          stroke="rgb(var(--accent))"
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />
        <circle
          cx="200"
          cy="200"
          r="74"
          fill="none"
          stroke="rgb(var(--accent-2))"
          strokeOpacity="0.3"
          strokeWidth="0.6"
          strokeDasharray="3 7"
        />
      </g>

      {/* Still core */}
      <circle
        cx="200"
        cy="200"
        r="42"
        fill="none"
        stroke={`url(#mc-grad-${uid})`}
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <circle
        cx="200"
        cy="200"
        r="5"
        fill="rgb(var(--accent))"
        className="animate-glow-pulse motion-reduce:animate-none"
      />
    </svg>
  );
}
