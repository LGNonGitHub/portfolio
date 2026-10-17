'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { getLenis, scrollTo, setLenis } from '@/lib/frame';

type ScrollToDetail = { target: string | HTMLElement; offset?: number };

/**
 * Momentum scrolling, and the site's single handler for in-page anchors.
 *
 * Lenis is created without its own requestAnimationFrame loop and handed to
 * the frame ticker (src/lib/frame.ts), which advances it first in every frame
 * so scroll-linked effects never read a stale position.
 *
 * Deliberately skipped when the visitor prefers reduced motion or pressed 静 —
 * hijacking the scroll is exactly the thing those settings ask us not to do.
 * Anchors are still intercepted then, because their other job, moving keyboard
 * focus to the target, matters most to exactly those visitors.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  // Overlays can ask for a stop before Lenis exists, or while it is being
  // rebuilt for a motion change; remember the request so the new instance
  // honours it.
  const stopped = useRef(false);

  // Anchors, overlay stop/start and the 'lenis:to' request: always on.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as Element | null)?.closest?.(
        'a[href]',
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute('download')) return;
      if (anchor.target && anchor.target !== '_self') return;

      // Same document only: '#stack' here, and '/#stack' when we are already
      // on '/'. Anything else is a real navigation.
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        url.search !== window.location.search ||
        url.hash.length < 2
      ) {
        return;
      }
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;

      e.preventDefault();
      scrollTo(el, { offset: -24, focus: true });
      // Keep Next's own history state; replacing it with null breaks its
      // back/forward bookkeeping.
      history.replaceState(history.state, '', url.hash);
    };

    // Overlays (modal, mobile menu, preloader) suspend Lenis by dispatching
    // these instead of holding a reference to the instance. Without this the
    // page keeps scrolling behind a dialog, and the dialog's own overflow
    // container never receives the wheel.
    const onStop = () => {
      stopped.current = true;
      getLenis()?.stop();
    };
    const onStart = () => {
      stopped.current = false;
      getLenis()?.start();
    };
    const onTo = (e: Event) => {
      const detail = (e as CustomEvent<ScrollToDetail>).detail;
      if (detail?.target) scrollTo(detail.target, { offset: detail.offset });
    };

    document.addEventListener('click', onClick);
    window.addEventListener('lenis:stop', onStop);
    window.addEventListener('lenis:start', onStart);
    window.addEventListener('lenis:to', onTo);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('lenis:stop', onStop);
      window.removeEventListener('lenis:start', onStart);
      window.removeEventListener('lenis:to', onTo);
    };
  }, []);

  // Lenis itself: destroyed and rebuilt whenever motion toggles to or from
  // reduced/still.
  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      autoRaf: false,
    });
    if (stopped.current) lenis.stop();
    setLenis(lenis);

    return () => {
      setLenis(null);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
