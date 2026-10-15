'use client';

import { Marquee } from '@/components/ui/Marquee';
import { marqueeWords } from '@/lib/content';

/** Full-bleed scrolling word band used as a section divider. */
export function Ticker({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className="relative border-y border-fg/[0.1] bg-surface/30 py-5">
      <Marquee speed={46} reverse={reverse} className="mask-fade-x">
        {marqueeWords.map((word) => (
          <span key={word} className="flex items-center">
            <span className="display whitespace-nowrap px-6 text-2xl text-fg/80 sm:text-4xl">
              {word}
            </span>
            <span className="text-accent" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
