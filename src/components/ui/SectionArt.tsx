'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Full-scale key art, one composition per section.
 *
 * Original geometry throughout — no traced characters, no borrowed assets.
 * Each piece reaches for the *idea* its series is built on rather than its
 * cast: a grimoire thrown open, a bolt tearing through halftone, a wand
 * crossed with a sword under a star chart, a tower of floors hanging in a
 * HUD, a blossom coming apart in the wind.
 *
 * Everything is drawn in currentColor plus the two accent channels, so each
 * piece recolours itself with whichever section palette is active.
 */
export type ArtKind = 'grimoire' | 'bolt' | 'wandsword' | 'tower' | 'bloom';

export function SectionArt({
  kind,
  className,
}: {
  kind: ArtKind;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const a = 'rgb(var(--accent))';
  const a2 = 'rgb(var(--accent-2))';

  const svg = (children: React.ReactNode) => (
    <svg
      viewBox="0 0 420 520"
      fill="none"
      aria-hidden
      className={cn('h-full w-full', className)}
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={a2} />
        </linearGradient>
        <radialGradient id={`r${uid}`}>
          <stop offset="0%" stopColor={a} stopOpacity="0.3" />
          <stop offset="100%" stopColor={a} stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`dots${uid}`}
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.6" fill={a} fillOpacity="0.5" />
        </pattern>
      </defs>
      {children}
    </svg>
  );

  // ── Work · a grimoire thrown open ────────────────────────────────────────
  if (kind === 'grimoire') {
    return svg(
      <>
        <circle cx="210" cy="250" r="190" fill={`url(#r${uid})`} />
        {/* spell circle behind the book */}
        <g className="origin-center motion-safe:animate-spin-slow">
          <circle cx="210" cy="250" r="168" stroke={a} strokeOpacity="0.3" strokeWidth="1" />
          <circle cx="210" cy="250" r="146" stroke={a2} strokeOpacity="0.3" strokeWidth="6" strokeDasharray="26 18" />
          {/* five-point star, inscribed */}
          <path
            d="M210 104 L285 334 L90 191 L330 191 L135 334 Z"
            stroke={`url(#g${uid})`}
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </g>
        {/* the book */}
        <path d="M210 212v212" stroke={a} strokeOpacity="0.8" strokeWidth="2.5" />
        <path
          d="M210 212c-34-26-78-38-122-38v190c44 0 88 12 122 38"
          stroke={a}
          strokeOpacity="0.85"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M210 212c34-26 78-38 122-38v190c-44 0-88 12-122 38"
          stroke={a}
          strokeOpacity="0.85"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* ruled lines on each page */}
        {Array.from({ length: 7 }).map((_, i) => (
          <g key={i} stroke={a2} strokeOpacity="0.4" strokeWidth="1.4">
            <path d={`M106 ${214 + i * 22}h78`} />
            <path d={`M236 ${214 + i * 22}h78`} />
          </g>
        ))}
        {/* sparks lifting off the page */}
        {[
          [160, 150], [268, 138], [210, 118], [128, 186], [300, 176],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M${x} ${y - 9} l2.6 5.6 6 .8-4.4 4.2 1 6-5.2-2.9-5.2 2.9 1-6-4.4-4.2 6-.8z`}
            fill={a}
            fillOpacity={0.65 - i * 0.07}
          />
        ))}
      </>,
    );
  }

  // ── About · a bolt through halftone ──────────────────────────────────────
  if (kind === 'bolt') {
    return svg(
      <>
        <circle cx="210" cy="250" r="190" fill={`url(#r${uid})`} />
        {/* comic burst frame */}
        <path
          d={Array.from({ length: 28 })
            .map((_, i) => {
              const ang = (i / 28) * Math.PI * 2;
              const rad = i % 2 === 0 ? 182 : 150;
              const x = 210 + Math.cos(ang) * rad;
              const y = 250 + Math.sin(ang) * rad * 1.08;
              return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' ') + ' Z'}
          stroke={a2}
          strokeOpacity="0.4"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* halftone wash */}
        <circle cx="210" cy="250" r="140" fill={`url(#dots${uid})`} opacity="0.5" />
        {/* speed lines raking in */}
        {Array.from({ length: 18 }).map((_, i) => {
          const ang = (i / 18) * Math.PI * 2;
          const x1 = 210 + Math.cos(ang) * 112;
          const y1 = 250 + Math.sin(ang) * 112;
          const x2 = 210 + Math.cos(ang) * 176;
          const y2 = 250 + Math.sin(ang) * 176;
          return (
            <path
              key={i}
              d={`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`}
              stroke={a}
              strokeOpacity={i % 3 === 0 ? 0.55 : 0.25}
              strokeWidth={i % 3 === 0 ? 2.4 : 1.2}
              strokeLinecap="round"
            />
          );
        })}
        {/* the bolt */}
        <path
          d="M238 130L150 268h62l-18 122 108-152h-66z"
          fill={`url(#g${uid})`}
          fillOpacity="0.9"
        />
        <path
          d="M238 130L150 268h62l-18 122 108-152h-66z"
          stroke={a}
          strokeOpacity="0.9"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </>,
    );
  }

  // ── Stack · wand and sword under a star chart ────────────────────────────
  if (kind === 'wandsword') {
    const stars: Array<[number, number, number]> = [
      [96, 128, 2.6], [168, 92, 1.8], [250, 118, 3], [318, 86, 2],
      [346, 168, 2.4], [78, 212, 1.9], [150, 186, 2.2], [286, 206, 1.7],
      [112, 318, 2.3], [330, 300, 2], [214, 150, 2.8], [60, 150, 1.6],
    ];
    return svg(
      <>
        <circle cx="210" cy="250" r="190" fill={`url(#r${uid})`} />
        <g className="origin-center motion-safe:animate-spin-slow">
          <circle cx="210" cy="250" r="178" stroke={a2} strokeOpacity="0.28" strokeWidth="1" />
          <circle cx="210" cy="250" r="140" stroke={a} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="3 9" />
        </g>
        {/* constellation lines */}
        <path
          d="M96 128L168 92L250 118L318 86L346 168M168 92L214 150L286 206M150 186L214 150M112 318L150 186"
          stroke={a2}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        {stars.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={a} fillOpacity={0.5 + (r % 1) * 0.3} />
        ))}
        {/* sword */}
        <g stroke={a} strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M126 412L300 196" />
          <path d="M286 170l28 26" />
          <path d="M300 196l-26-24" />
          <path d="M118 424l14-4-10-10z" fill={a} fillOpacity="0.5" />
        </g>
        {/* wand */}
        <g stroke={a2} strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M296 412L132 198" />
        </g>
        <path
          d="M126 176l5 11 12 1.6-9 8.6 2.2 12-10.2-6-10.2 6 2.2-12-9-8.6 12-1.6z"
          fill={`url(#g${uid})`}
        />
      </>,
    );
  }

  // ── Path · a tower of floors inside a HUD ────────────────────────────────
  if (kind === 'tower') {
    return svg(
      <>
        <circle cx="210" cy="250" r="190" fill={`url(#r${uid})`} />
        {/* grid horizon */}
        {Array.from({ length: 9 }).map((_, i) => (
          <path
            key={`h${i}`}
            d={`M40 ${404 + i * 13}h340`}
            stroke={a2}
            strokeOpacity={0.3 - i * 0.03}
            strokeWidth="1"
          />
        ))}
        {/* stacked floors, narrowing upward */}
        {Array.from({ length: 7 }).map((_, i) => {
          const w = 186 - i * 20;
          const y = 372 - i * 44;
          return (
            <g key={i}>
              <path
                d={`M${210 - w / 2} ${y} L${210 + w / 2} ${y} L${210 + w / 2 - 16} ${y - 30} L${210 - w / 2 + 16} ${y - 30} Z`}
                stroke={a}
                strokeOpacity={0.45 + i * 0.07}
                strokeWidth="1.6"
                fill={a}
                fillOpacity={0.05 + i * 0.015}
                strokeLinejoin="round"
              />
              <text
                x={210 + w / 2 + 12}
                y={y - 12}
                fontSize="9"
                fontFamily="monospace"
                fill={a2}
                fillOpacity="0.6"
              >
                {String(i + 1).padStart(2, '0')}
              </text>
            </g>
          );
        })}
        {/* spire */}
        <path d="M210 68v54" stroke={`url(#g${uid})`} strokeWidth="2.4" />
        <circle cx="210" cy="62" r="6" fill={a} />
        {/* HUD brackets */}
        {[
          'M34 96V58h40', 'M386 96V58h-40', 'M34 440v38h40', 'M386 440v38h-40',
        ].map((d, i) => (
          <path key={i} d={d} stroke={a} strokeOpacity="0.55" strokeWidth="2" />
        ))}
      </>,
    );
  }

  // ── Contact · a blossom coming apart ─────────────────────────────────────
  return svg(
    <>
      <circle cx="210" cy="250" r="190" fill={`url(#r${uid})`} />
      <g className="origin-center motion-safe:animate-spin-slow">
        <circle cx="210" cy="250" r="162" stroke={a2} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 10" />
      </g>
      {/* the flower */}
      <g>
        {Array.from({ length: 5 }).map((_, i) => (
          <ellipse
            key={i}
            cx="210"
            cy="186"
            rx="36"
            ry="62"
            transform={`rotate(${i * 72} 210 250)`}
            stroke={a}
            strokeOpacity="0.75"
            strokeWidth="1.8"
            fill={a}
            fillOpacity="0.07"
          />
        ))}
        <circle cx="210" cy="250" r="17" fill={`url(#g${uid})`} fillOpacity="0.85" />
        {Array.from({ length: 8 }).map((_, i) => {
          const ang = (i / 8) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={210 + Math.cos(ang) * 26}
              cy={250 + Math.sin(ang) * 26}
              r="2.4"
              fill={a2}
              fillOpacity="0.8"
            />
          );
        })}
      </g>
      {/* petals drifting off */}
      {[
        [78, 136, -28], [334, 160, 34], [60, 350, 18],
        [352, 372, -22], [128, 432, 8], [296, 452, -14], [166, 96, 24],
      ].map(([x, y, rot], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path
            d="M0 -13 Q10 -3 0 13 Q-10 -3 0 -13Z"
            fill={a}
            fillOpacity={0.4 - i * 0.03}
            stroke={a}
            strokeOpacity={0.5 - i * 0.04}
            strokeWidth="1"
          />
        </g>
      ))}
    </>,
  );
}
