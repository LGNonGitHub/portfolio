'use client';

/**
 * Mounts the mana stage — and, more often than you would think, declines to.
 *
 * The canvas is one fixed layer behind everything on the home page. It is
 * never loaded on a route that has no sections to anchor to, never on
 * Save-Data or a low-memory device, never without WebGL2, and never before
 * the LCP has painted: the import happens in requestIdleCallback, or after the
 * opening cast has finished, so the sigil arrives as a reward rather than as a
 * cost. Everything it draws has a DOM fallback underneath it.
 */
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { PetalFallback } from '@/components/gl/PetalFallback';
import { declined } from '@/lib/gl/quality';
import { hackathons, timeline } from '@/lib/content';

type Idle = (cb: () => void, opts?: { timeout: number }) => number;

export function StageMount() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (pathname !== '/') return;
    const canvas = canvasRef.current;
    if (!canvas || declined()) return;

    let disposed = false;
    let stage: { dispose: () => void } | null = null;

    const boot = () => {
      if (disposed) return;
      import('@/lib/gl/engine')
        .then(({ init }) => {
          if (disposed) return;
          // Counts come from content.ts here, so the engine chunk never pulls
          // the content in: the SAO tower has one floor per real timeline
          // entry and one rune per real hackathon.
          stage = init({
            canvas,
            floors: timeline.length,
            runes: hackathons.length,
          });
        })
        .catch(() => {
          /* A stage that cannot load is a silent no-op: the SVG stays. */
        });
    };

    const cast = document.documentElement.getAttribute('data-cast');
    let timer = 0;
    if (cast === 'play') {
      // During the cold open the GPU is busy with the summoning circle; wait
      // for it to land, then assemble the sigil where the cast just finished.
      const onPhase = (e: Event) => {
        if ((e as CustomEvent<string>).detail === 'done') {
          window.removeEventListener('cast:phase', onPhase);
          boot();
        }
      };
      window.addEventListener('cast:phase', onPhase);
      timer = window.setTimeout(boot, 6000); // a stuck cast must not cost the stage
      return () => {
        disposed = true;
        window.clearTimeout(timer);
        window.removeEventListener('cast:phase', onPhase);
        stage?.dispose();
      };
    }

    const idle: Idle =
      (window as Window & { requestIdleCallback?: Idle }).requestIdleCallback ??
      ((cb) => window.setTimeout(cb, 600));
    const handle = idle(boot, { timeout: 2000 });

    return () => {
      disposed = true;
      window.clearTimeout(handle);
      stage?.dispose();
    };
  }, [pathname]);

  if (pathname !== '/') return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="stage-canvas pointer-events-none fixed inset-0 -z-20 h-full w-full"
      />
      <PetalFallback />
    </>
  );
}
