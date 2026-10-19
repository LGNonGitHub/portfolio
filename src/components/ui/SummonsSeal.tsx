'use client';

import { MagicCircle } from '@/components/ui/MagicCircle';
import { formatTime } from '@/lib/utils';
import { site } from '@/lib/content';

/**
 * The receipt for a delivered message: a sigil struck for this summons only.
 *
 * The geometry is hashed from the sender's name and the minute it arrived, so
 * two people get different circles and the same person gets a different one
 * tomorrow — the seal is a record of their send rather than decoration that
 * happens to appear afterwards. Everything on it is real: the time is the
 * actual clock in Mishal's timezone, and the promise under it is the same one
 * the CTA makes above.
 */
export function SummonsSeal({ name, sentAt }: { name: string; sentAt: Date }) {
  // FNV-1a over name + the minute, which is stable for a re-render but not
  // across sends. Cheap, dependency-free, and good enough to spread seeds.
  let h = 0x811c9dc5;
  for (const ch of name + sentAt.toISOString().slice(0, 16)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }

  return (
    <div className="flex items-center gap-5">
      <span aria-hidden className="block h-[120px] w-[120px] shrink-0">
        <MagicCircle
          className="h-full w-full"
          points={5 + (h % 4)}
          seed={1 + (h % 997)}
          glyphs
        />
      </span>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          {/* formatTime carries seconds for the live clocks; a receipt wants
              the minute it landed, not a stopwatch. */}
          Summons received · {formatTime(sentAt, site.timezone).slice(0, 5)} IST
        </p>
        <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted">
          I reply to everything within a couple of days.
        </p>
      </div>
    </div>
  );
}
