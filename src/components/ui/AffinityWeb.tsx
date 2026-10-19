'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { EASE_OUT } from '@/lib/motion';

/**
 * The affinity web: one vertex per skill in the group, the polygon pulled out
 * to each level. Every group in `skillGroups` holds six, so this lands on the
 * hexagram the sigils already inscribe rather than an arbitrary blob.
 *
 * It is decorative and `aria-hidden`: the bars beside it are the real data,
 * each already a `role="meter"` carrying its own name and value. Nothing here
 * is the only place a number appears.
 *
 * No running animation. It draws once when it scrolls in and then holds, so
 * the still-idle gate keeps passing and the section adds no per-frame work.
 */
export function AffinityWeb({
  levels,
  active,
}: {
  levels: number[];
  /** Index of the skill being hovered or focused in the list, or null. */
  active: number | null;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const reduced = useReducedMotion();

  const n = levels.length;
  const C = 100;
  const R = 68;

  // Every coordinate is rounded before it reaches an attribute. Node and the
  // browser print the last digit of a float differently (44.0787556523146 vs
  // 44.078755652314605), which React reports as a hydration mismatch.
  const r2 = (v: number) => Number(v.toFixed(2));

  // -90° so the first vertex is at the top; the rest run clockwise.
  const pointAt = (i: number, r: number) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [r2(C + r * Math.cos(a)), r2(C + r * Math.sin(a))] as const;
  };
  const ring = (r: number) =>
    Array.from({ length: n }, (_, i) => pointAt(i, r).join(',')).join(' ');

  const data = levels
    .map((lvl, i) => pointAt(i, (Math.max(0, Math.min(100, lvl)) / 100) * R).join(','))
    .join(' ');

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      aria-hidden
      className="h-auto w-full max-w-[26rem] overflow-visible"
    >
      {/* Web: four rings at 25/50/75/100 and a spoke to each vertex. */}
      <g className="stroke-fg/[0.14]" fill="none" strokeWidth={0.6}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={ring(R * f)} />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const [x, y] = pointAt(i, R);
          return <line key={i} x1={C} y1={C} x2={x} y2={y} />;
        })}
      </g>

      {/* Tick marks outside the rim — the same counted edge as the sigils. */}
      <g className="stroke-accent/30" strokeWidth={0.8}>
        {Array.from({ length: n * 6 }, (_, i) => {
          const a = (-90 + (360 / (n * 6)) * i) * (Math.PI / 180);
          const r0 = R + 5;
          const r1 = r0 + (i % 6 === 0 ? 5 : 2.5);
          return (
            <line
              key={i}
              x1={r2(C + r0 * Math.cos(a))}
              y1={r2(C + r0 * Math.sin(a))}
              x2={r2(C + r1 * Math.cos(a))}
              y2={r2(C + r1 * Math.sin(a))}
            />
          );
        })}
      </g>

      {/* The scale, read once up the top spoke so the shape has a unit. */}
      <g className="fill-faint font-mono" fontSize={5.5} textAnchor="start">
        {[25, 50, 75, 100].map((v) => (
          <text key={v} x={C + 2.5} y={C - (R * v) / 100 + 2}>
            {v}
          </text>
        ))}
      </g>

      {/* The spoke under the skill being pointed at, so the list and the web
          name the same thing. */}
      {active !== null && active < n ? (
        <line
          x1={C}
          y1={C}
          x2={pointAt(active, R)[0]}
          y2={pointAt(active, R)[1]}
          className="stroke-accent-2/60"
          strokeWidth={1}
        />
      ) : null}

      {/* The reading itself, grown from the centre once. */}
      <motion.g
        initial={reduced ? false : { scale: 0.001, opacity: 0 }}
        animate={inView || reduced ? { scale: 1, opacity: 1 } : undefined}
        transition={{ duration: 1.1, ease: EASE_OUT }}
        style={{ transformOrigin: '100px 100px' }}
      >
        <polygon
          points={data}
          className="fill-accent/[0.16] stroke-accent"
          strokeWidth={1.4}
          style={{ filter: 'drop-shadow(0 0 5px rgb(var(--accent) / 0.5))' }}
        />
        {levels.map((lvl, i) => {
          const [x, y] = pointAt(i, (Math.max(0, Math.min(100, lvl)) / 100) * R);
          const on = active === i;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={on ? 4 : 2.1}
              className={on ? 'fill-accent-2 stroke-bg' : 'fill-accent stroke-bg'}
              strokeWidth={1}
              style={{ transition: 'r 220ms ease-out' }}
            />
          );
        })}
      </motion.g>
    </svg>
  );
}
