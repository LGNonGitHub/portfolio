'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Counts from 0 to `value` once the element scrolls into view.
 *
 * The server renders the real number. It used to render 0, which is what
 * crawlers, link unfurls and anyone without JS saw: "0 Projects built". After
 * hydration, a counter that is still off-screen is parked at 0 so it can count
 * up when it arrives; one already on screen keeps its value and doesn't jump.
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

  useEffect(() => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const onScreen = r.top < window.innerHeight && r.bottom > 0;
    if (!onScreen) {
      armed.current = true;
      setDisplay(0);
    }
  }, [reduced]);

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
      {display}
      {suffix}
    </span>
  );
}
