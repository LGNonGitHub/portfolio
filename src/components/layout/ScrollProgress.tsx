'use client';

import { useEffect, useRef } from 'react';
import { nav } from '@/lib/content';
import { invalidate, scrollY, subscribe } from '@/lib/frame';
import { clamp } from '@/lib/utils';

const IDS = nav.map((n) => n.href.slice(1));

/**
 * The season's episode bar, pinned to the top edge: one segment per section,
 * each as wide as its episode is long and each filling in that episode's own
 * colour, the way an HP bar is divided into gauges in SAO's HUD. On the hero
 * every segment is empty; the season has not started.
 *
 * A segment fills as the viewport's centre line crosses its section — the
 * same line the palette and the nav pill follow, so all three agree.
 *
 * Written straight to style.transform from the frame ticker: no React state
 * per scroll frame, no spring library, compositor-only.
 */
export function ScrollProgress() {
  const segments = useRef<(HTMLSpanElement | null)[]>([]);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let bands: { top: number; height: number }[] = [];
    const shown: number[] = IDS.map(() => -1);

    // Section geometry only changes when the document does, so it is
    // measured on resize, never per frame.
    const measure = () => {
      const y = scrollY();
      bands = IDS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return { top: 0, height: 0 };
        const r = el.getBoundingClientRect();
        return { top: r.top + y, height: r.height };
      });
      bands.forEach((b, i) => {
        const seg = segments.current[i];
        // A missing section (another page) collapses its segment entirely.
        if (seg) seg.style.flexGrow = String(b.height);
        if (seg) seg.style.display = b.height ? '' : 'none';
      });
      shown.fill(-1);
      invalidate();
    };

    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    measure();

    const unsubscribe = subscribe(() => {
      const line = scrollY() + window.innerHeight / 2;
      for (let i = 0; i < bands.length; i++) {
        const { top, height } = bands[i];
        const p = height ? Math.round(clamp((line - top) / height) * 1000) / 1000 : 0;
        if (p === shown[i]) continue;
        shown[i] = p;
        const fill = fills.current[i];
        if (fill) fill.style.transform = `scaleX(${p})`;
      }
    });

    return () => {
      ro.disconnect();
      unsubscribe();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9997] flex h-[2px] gap-[2px]"
    >
      {IDS.map((id, i) => (
        <span
          key={id}
          ref={(el) => {
            segments.current[i] = el;
          }}
          data-progress-segment=""
          data-palette={id}
          className="relative h-full flex-1 overflow-hidden bg-fg/[0.08]"
        >
          <span
            ref={(el) => {
              fills.current[i] = el;
            }}
            className="absolute inset-0 origin-left bg-accent"
            style={{ transform: 'scaleX(0)' }}
          />
        </span>
      ))}
    </div>
  );
}
