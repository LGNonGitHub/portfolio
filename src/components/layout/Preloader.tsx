'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/**
 * The Link Start dive, matched to the reference footage rather than memory.
 *
 * Beat sheet taken off the frames:
 *   0.00  black
 *   0.45  hard cut to WHITE — the whole sequence plays on white, not black
 *   0.55  a tiny multicoloured burst at dead centre, growing
 *   1.00  tapered colour WEDGES tear outward past the viewer; the palette is
 *         printer-ish (magenta, yellow, green, red, cyan, black, grey), not a
 *         rainbow gradient
 *   2.10  the wedges sweep off and the field clears back to white
 *   2.45  concentric cyan/purple HUD rings bloom in
 *   2.75  the five senses report in one at a time, each with an OK badge
 *   4.30  white-out, and the page is revealed in light mode
 *
 * The page sits in light mode behind it throughout, so the final white-out is
 * a dissolve into the site rather than a cut.
 */

const SENSES = ['SIGHT', 'HEARING', 'TOUCH', 'TASTE', 'SMELL'] as const;

/** Lifted off the frames — flat print colours, no glow. */
const WEDGE_COLOURS = [
  '#D921A8', '#E8D21A', '#22B14C', '#E82020', '#22C8DC', '#1A1A1A',
  '#9A9A9A', '#D921A8', '#E8D21A', '#22B14C', '#1A1A1A', '#22C8DC',
  '#E82020', '#9A9A9A', '#D921A8', '#E8D21A', '#22B14C', '#22C8DC',
  '#1A1A1A', '#D921A8', '#E8D21A', '#9A9A9A', '#E82020', '#22C8DC',
];

const T = {
  white: 450,
  burst: 550,
  wedges: 1000,
  clear: 2100,
  hud: 2450,
  senses: 2750,
  senseStep: 240,
  out: 4300,
  done: 4950,
} as const;

export function Preloader() {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const [done, setDone] = useState(true);
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('preloaded') === '1';
    } catch {
      /* private mode — play it */
    }

    // The destination is light mode whether or not the sequence runs.
    const goLight = () => {
      try {
        if (!localStorage.getItem('theme')) {
          document.documentElement.dataset.theme = 'light';
        }
      } catch {
        document.documentElement.dataset.theme = 'light';
      }
    };
    goLight();

    if (seen || reduced) {
      setDone(true);
      document.body.style.overflow = '';
      return;
    }

    setDone(false);
    setT(0);
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new Event('lenis:stop'));

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    ([T.white, T.burst, T.wedges, T.clear, T.hud, T.out] as number[]).forEach((ms) =>
      at(ms, () => setT(ms)),
    );
    SENSES.forEach((_, i) => at(T.senses + i * T.senseStep, () => setLit(i)));

    at(T.done, () => {
      try {
        sessionStorage.setItem('preloaded', '1');
      } catch {
        /* ignore */
      }
      setDone(true);
      document.body.style.overflow = '';
      window.dispatchEvent(new Event('lenis:start'));
    });

    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = '';
      window.dispatchEvent(new Event('lenis:start'));
    };
  }, [reduced]);

  const onWhite = t >= T.white;
  const bursting = t >= T.burst && t < T.clear;
  const tearing = t >= T.wedges && t < T.clear;
  const hudUp = t >= T.hud;
  const blowingOut = t >= T.out;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          aria-hidden
          data-lenis-prevent
          className="fixed inset-0 z-[10000] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ backgroundColor: onWhite ? '#ffffff' : '#000000' }}
        >
          {/* ── The wedges: tapered shards tearing outward from centre ── */}
          <div className="absolute inset-0">
            {WEDGE_COLOURS.map((colour, i) => {
              const angle = (i / WEDGE_COLOURS.length) * 360;
              const thickness = 5 + ((i * 7) % 12);
              return (
                <motion.span
                  key={`${colour}-${i}`}
                  className="absolute left-1/2 top-1/2 block"
                  style={{
                    width: '130vmax',
                    height: `${thickness}vmax`,
                    backgroundColor: colour,
                    transformOrigin: '0% 50%',
                    rotate: `${angle}deg`,
                    // Apex at centre, widening as it travels out.
                    clipPath: 'polygon(0 50%, 100% 0%, 100% 100%)',
                    marginTop: `-${thickness / 2}vmax`,
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={
                    tearing
                      ? {
                          scaleX: [0, 0.28, 0.75, 1.3],
                          opacity: [0, 1, 1, 0],
                        }
                      : { scaleX: 0, opacity: 0 }
                  }
                  transition={{
                    duration: 1.25,
                    times: [0, 0.18, 0.68, 1],
                    delay: (i % 8) * 0.04,
                    ease: [0.32, 0, 0.3, 1],
                  }}
                />
              );
            })}
          </div>

          {/* ── The seed burst at dead centre ── */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={
              bursting
                ? { scale: [0, 0.6, 2.4], opacity: [0, 1, 0], rotate: 120 }
                : { scale: 0, opacity: 0 }
            }
            transition={{ duration: 1.3, ease: [0.3, 0, 0.2, 1] }}
          >
            {WEDGE_COLOURS.slice(0, 12).map((colour, i) => (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 block h-1.5 w-12 origin-left"
                style={{
                  backgroundColor: colour,
                  transform: `rotate(${(i / 12) * 360}deg)`,
                  clipPath: 'polygon(0 50%, 100% 0%, 100% 100%)',
                }}
              />
            ))}
          </motion.div>

          {/* ── Sensory calibration HUD ── */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="relative"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={
                hudUp && !blowingOut
                  ? { scale: 1, opacity: 1 }
                  : { scale: blowingOut ? 1.25 : 0.4, opacity: 0 }
              }
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <svg
                viewBox="0 0 440 440"
                className="h-[min(78vw,30rem)] w-[min(78vw,30rem)]"
              >
                {/* Concentric rings, counter-rotating */}
                <g className="origin-center motion-safe:animate-spin-slow">
                  <circle cx="220" cy="220" r="206" fill="none" stroke="#29ABE2" strokeOpacity="0.5" strokeWidth="1.5" />
                  <circle cx="220" cy="220" r="190" fill="none" stroke="#8B7FD4" strokeOpacity="0.45" strokeWidth="10" strokeDasharray="56 22" />
                </g>
                <g className="origin-center motion-safe:animate-spin-reverse">
                  <circle cx="220" cy="220" r="162" fill="none" stroke="#29ABE2" strokeOpacity="0.85" strokeWidth="16" strokeDasharray="120 40" />
                  <circle cx="220" cy="220" r="140" fill="none" stroke="#7EC8E3" strokeOpacity="0.6" strokeWidth="3" />
                </g>
                <g className="origin-center motion-safe:animate-spin-slow">
                  <circle cx="220" cy="220" r="112" fill="none" stroke="#8B7FD4" strokeOpacity="0.55" strokeWidth="6" strokeDasharray="10 14" />
                </g>
                <circle cx="220" cy="220" r="86" fill="#29ABE2" fillOpacity="0.16" stroke="#29ABE2" strokeOpacity="0.7" strokeWidth="2" />

                {/* Progress arc — fills as the senses report in */}
                <motion.circle
                  cx="220" cy="220" r="86"
                  fill="none" stroke="#1B9CD8" strokeWidth="6" strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  initial={{ strokeDashoffset: 1 }}
                  animate={{ strokeDashoffset: 1 - (lit + 1) / SENSES.length }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  transform="rotate(-90 220 220)"
                />
              </svg>

              {/* Centre readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#1B9CD8]">
                  Link Start
                </span>
                <span className="display text-3xl text-[#0E7FB8]">
                  {Math.round(((lit + 1) / SENSES.length) * 100)}
                  <span className="text-base">%</span>
                </span>
              </div>
            </motion.div>

            {/* Sense list with OK badges */}
            <motion.ul
              className="absolute bottom-[12%] left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: hudUp && !blowingOut ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            >
              {SENSES.map((sense, i) => {
                const ok = lit >= i;
                return (
                  <li
                    key={sense}
                    className="flex items-center gap-1.5 rounded-sm px-2 py-1 transition-colors duration-200"
                    style={{ backgroundColor: ok ? 'rgba(41,171,226,0.14)' : 'transparent' }}
                  >
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-200"
                      style={{ color: ok ? '#0E7FB8' : '#9FC6DA' }}
                    >
                      {sense}
                    </span>
                    <motion.span
                      className="rounded-sm px-1 font-mono text-[9px] font-bold tracking-[0.1em] text-white"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={ok ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                      style={{ backgroundColor: '#5BBFDC' }}
                    >
                      OK
                    </motion.span>
                  </li>
                );
              })}
            </motion.ul>
          </div>

          {/* ── White-out into the page ── */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: blowingOut ? 1 : 0 }}
            transition={{ duration: 0.4, ease: 'easeIn' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
