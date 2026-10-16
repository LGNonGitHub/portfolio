'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from '@/hooks/useMediaQuery';

/**
 * Momentum scrolling. Deliberately skipped when the visitor prefers reduced
 * motion — hijacking the scroll is exactly the thing that setting asks us
 * not to do.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Make in-page anchors route through Lenis so they ease instead of jump.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -24, duration: 1.4 });
      history.replaceState(null, '', id);
      // preventDefault also cancels the browser moving the sequential-focus
      // starting point, so "Skip to content" left focus on the link and the
      // next Tab went back into the nav. Move it by hand, without letting the
      // browser jump-scroll and fight the eased scroll.
      const target = el as HTMLElement;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };

    // Overlays (modal, mobile menu, preloader) suspend Lenis by dispatching
    // these instead of holding a reference to the instance. Without this the
    // page keeps scrolling behind a dialog, and the dialog's own overflow
    // container never receives the wheel.
    const onStop = () => lenis.stop();
    const onStart = () => lenis.start();

    document.addEventListener('click', onClick);
    window.addEventListener('lenis:stop', onStop);
    window.addEventListener('lenis:start', onStart);

    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('lenis:stop', onStop);
      window.removeEventListener('lenis:start', onStart);
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
