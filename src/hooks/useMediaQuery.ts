'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useRuntime } from '@/hooks/useRuntime';

/**
 * SSR-safe media query hook. Returns `false` on the server and while
 * hydrating, so it never causes a hydration mismatch, then the real value.
 *
 * Built on useSyncExternalStore rather than useEffect + useState: a component
 * that mounts after hydration (a lazy section, the mobile menu) gets the right
 * answer on its first render instead of rendering the `false` branch once and
 * then flipping.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * True when motion should stand down: the visitor's system asks for reduced
 * motion, OR they pressed 静 on this site. Every component that already
 * honoured reduced motion (reveals, counters, skill bars, the smooth scroll)
 * honours stillness through this, without having to know it exists.
 */
export function useReducedMotion() {
  const prefers = useMediaQuery('(prefers-reduced-motion: reduce)');
  const still = useRuntime((s) => s.motion === 'still');
  return prefers || still;
}

/** True on pointer-coarse devices (touch), where hover effects should stand down. */
export function useIsTouch() {
  return useMediaQuery('(hover: none), (pointer: coarse)');
}
