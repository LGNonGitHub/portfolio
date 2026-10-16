'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { site } from '@/lib/content';
import { MagicCircle } from '@/components/ui/MagicCircle';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Entry curtain: a system-boot readout, a summoning circle drawing itself, and
 * a counter to 100 before the panel wipes away. Shown once per tab session —
 * coming back from another page should not make you wait again.
 */
const BOOT_LINES = [
  'Establishing connection',
  'Calibrating palette',
  'Binding wand and sword',
  'Ready',
];

export function Preloader() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('preloaded') === '1';
    } catch {
      /* private mode — just show it */
    }

    if (seen || reduced) {
      setDone(true);
      document.body.style.overflow = '';
      return;
    }

    setDone(false);
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new Event('lenis:stop'));

    const start = performance.now();
    const DURATION = 2000;
    let frame = 0;

    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(Math.round(eased * 100));
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        try {
          sessionStorage.setItem('preloaded', '1');
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          setDone(true);
          document.body.style.overflow = '';
          window.dispatchEvent(new Event('lenis:start'));
        }, 460);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = '';
      window.dispatchEvent(new Event('lenis:start'));
    };
  }, [reduced]);

  // Which boot line is showing, derived from progress.
  const bootIndex = Math.min(
    BOOT_LINES.length - 1,
    Math.floor((progress / 100) * BOOT_LINES.length),
  );

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[10000] flex flex-col justify-between overflow-hidden bg-bg px-5 py-8 sm:px-8 sm:py-10"
          exit={{ y: '-100%' }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Summoning circle drawing itself behind everything */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(84vw,620px)] w-[min(84vw,620px)] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.78, rotate: -24 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <MagicCircle className="h-full w-full" points={7} seed={3} />
          </motion.div>

          <div className="relative flex items-start justify-between">
            <span className="eyebrow">{site.role}</span>
            <span className="eyebrow">{site.location}</span>
          </div>

          <div className="relative flex items-end justify-between gap-6">
            <div>
              <motion.p
                className="display h-display max-w-[14ch] text-fg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              >
                Mohammed
                <br />
                Mishal
              </motion.p>

              <div className="mt-5 flex h-5 items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={bootIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
                  >
                    {BOOT_LINES[bootIndex]}
                    <span className="animate-blink text-accent">_</span>
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <span className="duality-text font-mono text-4xl font-medium tabular-nums sm:text-6xl">
              {String(progress).padStart(3, '0')}
            </span>
          </div>

          <div className="relative h-px w-full overflow-hidden bg-fg/10">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent2"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
