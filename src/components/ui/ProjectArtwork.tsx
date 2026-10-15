'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Deterministic generative artwork standing in for project screenshots.
 *
 * Each project gets one of five variants, driven by its index, and is drawn
 * from the two colours in its `palette`. Swap this component for <Image /> once
 * real screenshots exist — the card layout does not care which it gets.
 */
export function ProjectArtwork({
  variant,
  palette,
  className,
  animate = true,
}: {
  variant: number;
  palette: [string, string];
  className?: string;
  animate?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduced = useReducedMotion();
  const live = animate && !reduced;
  const [a, b] = palette;
  const v = variant % 5;

  const common = {
    viewBox: '0 0 600 420',
    preserveAspectRatio: 'xMidYMid slice',
    className,
    role: 'img' as const,
    'aria-hidden': true,
  };

  // ── Variant 0 — concentric arcs ───────────────────────────────────────────
  if (v === 0) {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={b} />
            <stop offset="100%" stopColor={b} stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <rect width="600" height="420" fill={`url(#g${uid})`} />
        {Array.from({ length: 11 }).map((_, i) => (
          <motion.circle
            key={i}
            cx="300"
            cy="210"
            r={28 + i * 24}
            fill="none"
            stroke={a}
            strokeWidth={i % 3 === 0 ? 1.8 : 0.7}
            strokeOpacity={0.14 + (1 - i / 11) * 0.5}
            initial={live ? { scale: 0.82, opacity: 0 } : false}
            animate={live ? { scale: 1, opacity: 1 } : undefined}
            transition={{
              duration: 1.2,
              delay: i * 0.055,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ transformOrigin: '300px 210px' }}
          />
        ))}
        <circle cx="300" cy="210" r="16" fill={a} />
      </svg>
    );
  }

  // ── Variant 1 — vertical frequency bars ───────────────────────────────────
  if (v === 1) {
    return (
      <svg {...common}>
        <rect width="600" height="420" fill={b} />
        {Array.from({ length: 34 }).map((_, i) => {
          // Deterministic pseudo-random height so SSR and client agree.
          const seed = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
          const hgt = 40 + seed * 300;
          return (
            <motion.rect
              key={i}
              x={12 + i * 17.2}
              width="8"
              rx="4"
              y={210 - hgt / 2}
              height={hgt}
              fill={a}
              fillOpacity={0.22 + seed * 0.6}
              initial={live ? { scaleY: 0.1, opacity: 0 } : false}
              animate={live ? { scaleY: 1, opacity: 1 } : undefined}
              transition={{
                duration: 0.9,
                delay: i * 0.018,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ transformOrigin: `${16 + i * 17.2}px 210px` }}
            />
          );
        })}
      </svg>
    );
  }

  // ── Variant 2 — isometric grid ────────────────────────────────────────────
  if (v === 2) {
    return (
      <svg {...common}>
        <defs>
          <pattern
            id={`p${uid}`}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
            patternTransform="skewY(-14)"
          >
            <path d="M0 0H40V40H0z" fill="none" stroke={a} strokeOpacity="0.2" strokeWidth="0.9" />
          </pattern>
        </defs>
        <rect width="600" height="420" fill={b} />
        <rect width="600" height="420" fill={`url(#p${uid})`} />
        {[
          { x: 120, y: 90, s: 110 },
          { x: 300, y: 170, s: 150 },
          { x: 420, y: 70, s: 80 },
        ].map((r, i) => (
          <motion.rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.s}
            height={r.s}
            rx="6"
            fill={a}
            fillOpacity={0.14 + i * 0.16}
            stroke={a}
            strokeOpacity="0.55"
            initial={live ? { y: r.y + 40, opacity: 0 } : false}
            animate={live ? { y: r.y, opacity: 1 } : undefined}
            transition={{ duration: 1, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </svg>
    );
  }

  // ── Variant 3 — flowing sine ribbons ──────────────────────────────────────
  if (v === 3) {
    return (
      <svg {...common}>
        <rect width="600" height="420" fill={b} />
        {Array.from({ length: 16 }).map((_, i) => {
          const offset = i * 22;
          const d = `M -40 ${90 + offset} C 120 ${20 + offset}, 260 ${200 + offset}, 420 ${110 + offset} S 600 ${40 + offset}, 680 ${130 + offset}`;
          return (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke={a}
              strokeWidth={i % 4 === 0 ? 2 : 0.9}
              strokeOpacity={0.5 - i * 0.022}
              initial={live ? { pathLength: 0, opacity: 0 } : false}
              animate={live ? { pathLength: 1, opacity: 1 } : undefined}
              transition={{
                duration: 1.6,
                delay: i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}
      </svg>
    );
  }

  // ── Variant 4 — type specimen ─────────────────────────────────────────────
  return (
    <svg {...common}>
      <rect width="600" height="420" fill={b} />
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.rect
          key={i}
          x="48"
          y={70 + i * 52}
          width={i % 2 === 0 ? 420 : 310}
          height="14"
          rx="7"
          fill={a}
          fillOpacity={0.5 - i * 0.055}
          initial={live ? { scaleX: 0, opacity: 0 } : false}
          animate={live ? { scaleX: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.95, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: '48px center' }}
        />
      ))}
      <motion.text
        x="48"
        y="392"
        fill={a}
        fillOpacity="0.9"
        fontSize="104"
        fontWeight="700"
        fontFamily="var(--font-display), sans-serif"
        initial={live ? { opacity: 0, y: 410 } : false}
        animate={live ? { opacity: 0.9, y: 392 } : undefined}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        Aa
      </motion.text>
    </svg>
  );
}
