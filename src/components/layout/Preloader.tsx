'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { site } from '@/lib/content';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Entry curtain: a counter to 100 then a panel wipe. Shown once per tab
 * session — coming back from another page should not make you wait again.
 */
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

    const start = performance.now();
    const DURATION = 1700;
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
        }, 420);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = '';
    };
  }, [reduced]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[10000] flex flex-col justify-between bg-bg px-5 py-8 sm:px-8 sm:py-10"
          exit={{ y: '-100%' }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex items-start justify-between">
            <span className="eyebrow">{site.role}</span>
            <span className="eyebrow">{site.location}</span>
          </div>

          <div className="flex items-end justify-between gap-6">
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

            <span className="font-mono text-4xl font-medium tabular-nums text-accent sm:text-6xl">
              {String(progress).padStart(3, '0')}
            </span>
          </div>

          <div className="relative h-px w-full overflow-hidden bg-fg/10">
            <motion.div
              className="absolute inset-y-0 left-0 bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
