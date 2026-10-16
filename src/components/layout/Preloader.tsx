'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/**
 * The intro: the Link Start clip itself, first 8 seconds, then the page is
 * revealed in light mode as the footage whites out.
 *
 * Plays once per tab session. Muted and playsInline because every browser
 * blocks autoplay with sound — there is no way around that, so the audio track
 * is carried but silent.
 *
 * Three ways out, because a preloader that can trap someone is a bug:
 *   - it ends on its own
 *   - Skip, or Escape
 *   - the watchdog, if the file never loads at all
 *
 * NOTE: public/intro/link-start.* is copyrighted footage. It ships with the
 * repo and is served publicly, which is a takedown risk the owner accepted.
 */
const CLIP_MS = 8000;
/** If the video cannot play at all, never hold the page longer than this. */
const WATCHDOG_MS = 9500;

export function Preloader() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [done, setDone] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('preloaded') === '1';
    } catch {
      /* private mode — play it */
    }

    // The clip ends on white, so the page behind it is already light.
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
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new Event('lenis:stop'));

    const timers: number[] = [];
    const finish = () => {
      try {
        sessionStorage.setItem('preloaded', '1');
      } catch {
        /* ignore */
      }
      setFading(true);
      timers.push(
        window.setTimeout(() => {
          setDone(true);
          document.body.style.overflow = '';
          window.dispatchEvent(new Event('lenis:start'));
        }, 520),
      );
    };

    // Primary: the clip's own length. Watchdog: if it never plays.
    timers.push(window.setTimeout(finish, CLIP_MS));
    timers.push(window.setTimeout(finish, WATCHDOG_MS));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);

    // Some browsers reject autoplay even muted; do not hold the page hostage.
    const video = videoRef.current;
    video?.play?.().catch(() => finish());

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      window.dispatchEvent(new Event('lenis:start'));
    };
  }, [reduced]);

  const skip = () => {
    try {
      sessionStorage.setItem('preloaded', '1');
    } catch {
      /* ignore */
    }
    setDone(true);
    document.body.style.overflow = '';
    window.dispatchEvent(new Event('lenis:start'));
  };

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[10000] overflow-hidden bg-black"
          exit={{ opacity: 0 }}
          animate={{ opacity: fading ? 0 : 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          role="presentation"
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster="/intro/link-start-poster.jpg"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={skip}
            aria-hidden
          >
            <source src="/intro/link-start.webm" type="video/webm" />
            <source src="/intro/link-start.mp4" type="video/mp4" />
          </video>

          <button
            onClick={skip}
            className="absolute bottom-6 right-6 rounded-full border border-white/35 bg-black/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm transition-colors hover:border-white/70 hover:text-white"
          >
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
