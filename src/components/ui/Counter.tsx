'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/** useLayoutEffect in the browser (so a reset lands before the first
    paint), useEffect on the server (where layout effects only warn). */
const useIsoLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Read directly rather than through the hook: the hook is false until its
    own effect runs, which is after the moment this decision is made. */
function motionAllowed() {
  try {
    return (
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      document.documentElement.dataset.motion !== 'still'
    );
  } catch {
    return false;
  }
}

/**
 * Counts from 0 to `value` once the element scrolls into view.
 *
 * The server renders the real number. It used to render 0, which is what
 * crawlers, link unfurls and anyone without JS saw: "0 Projects built". On
 * the client, a counter that is still off-screen is reset to 0 before the
 * first paint (a layout effect, so the real number never flashes first) and
 * counts up when it arrives. One already on screen keeps its value and never
 * jumps; with reduced motion or 静 nothing is reset at all.
 *
 * The animating digits are aria-hidden and the true value sits beside them
 * for assistive tech, so a screen reader never announces "0" or a number
 * mid-count.
 */
export function Counter({
  value,
  suffix = '',
  duration = 1800,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -5% 0px' });
  const [display, setDisplay] = useState(value);
  const armed = useRef(false);
  const reduced = useReducedMotion();

  useIsoLayoutEffect(() => {
    if (!ref.current || !motionAllowed()) return;
    const r = ref.current.getBoundingClientRect();
    const onScreen = r.top < window.innerHeight && r.bottom > 0;
    if (!onScreen) {
      armed.current = true;
      setDisplay(0);
    }
  }, []);

  useEffect(() => {
    if (!inView || !armed.current) return;
    if (reduced) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast out of the gate, long settle
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplay(Math.round(eased * value));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden>
        {display}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}
