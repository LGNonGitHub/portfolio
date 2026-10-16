'use client';

import { cn } from '@/lib/utils';

/**
 * One emblem per section, so each theme is identifiable at a glance.
 *
 * These are original marks drawn from generic symbols — a grimoire, a bolt, a
 * crossed wand and sword, a stacked tower, a blossom. They evoke each series
 * without reproducing anyone's character art or logo, which matters because
 * this site gets deployed publicly.
 */
export type EmblemKind = 'grimoire' | 'bolt' | 'wandsword' | 'tower' | 'blossom';

export function SectionEmblem({
  kind,
  className,
}: {
  kind: EmblemKind;
  className?: string;
}) {
  const common = {
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cn('h-full w-full', className),
    'aria-hidden': true,
  };

  if (kind === 'grimoire') {
    // An open book, with a star rising off the page.
    return (
      <svg {...common}>
        <path d="M24 17v22" />
        <path d="M24 17c-4-3-9-4-14-4v22c5 0 10 1 14 4" />
        <path d="M24 17c4-3 9-4 14-4v22c-5 0-10 1-14 4" />
        <path d="M24 4l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
      </svg>
    );
  }

  if (kind === 'bolt') {
    // A bolt inside a broken ring — energy, contained.
    return (
      <svg {...common}>
        <path d="M26 7L14 27h8l-2 14 14-20h-8z" />
        <path d="M11 11a18 18 0 0 0-1 20" />
        <path d="M37 11a18 18 0 0 1 1 20" />
      </svg>
    );
  }

  if (kind === 'wandsword') {
    // Wand and sword crossed — the duality the whole site is built on.
    return (
      <svg {...common}>
        {/* sword */}
        <path d="M12 38L31 13" />
        <path d="M27 9l6 6" />
        <path d="M30 18l-5-5" />
        <path d="M10 40l4-1-3-3z" />
        {/* wand */}
        <path d="M36 38L19 14" />
        <path d="M17 8l1.2 2.6L21 11l-1.9 2 .5 2.8-2.6-1.3-2.6 1.3.5-2.8-1.9-2 2.8-.4z" />
      </svg>
    );
  }

  if (kind === 'tower') {
    // A floating tower of layers, framed by HUD brackets.
    return (
      <svg {...common}>
        <path d="M18 14h12l2 5H16z" />
        <path d="M16 22h16l2 6H14z" />
        <path d="M14 31h20l2 7H12z" />
        <path d="M24 14V7" />
        <path d="M6 9V5h5" />
        <path d="M42 9V5h-5" />
        <path d="M6 39v4h5" />
        <path d="M42 39v4h-5" />
      </svg>
    );
  }

  // blossom — five petals, quietly.
  return (
    <svg {...common}>
      {Array.from({ length: 5 }).map((_, i) => (
        <ellipse
          key={i}
          cx="24"
          cy="14"
          rx="5.5"
          ry="9"
          transform={`rotate(${i * 72} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
