'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { MotionConfig } from 'framer-motion';
import { useRuntime } from '@/hooks/useRuntime';
import {
  baseMotion,
  detectTier,
  runtime,
  type Accent,
  type Motion,
  type Theme,
} from '@/lib/runtime';
import { withTransition, type Origin } from '@/lib/transition';

type ThemeContextValue = {
  theme: Theme;
  /** Which half of the duality leads: green (sword/design) or purple (wand/code). */
  accent: Accent;
  motion: Motion;
  /** Pass the pressed button's centre; the new palette opens from there. */
  toggle: (origin?: Origin) => void;
  toggleAccent: (origin?: Origin) => void;
  /** 静: pause every ambient loop on the site, remembered across visits. */
  toggleStill: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  accent: 'green',
  motion: 'full',
  toggle: () => {},
  toggleAccent: () => {},
  toggleStill: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const remember = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage can be blocked — the choice still applies for this session */
  }
};

const screenCentre = (): Origin => ({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
});

/**
 * Theme, duality and stillness. The state itself lives in the runtime store
 * (src/lib/runtime.ts), seeded from the attributes the inline script in
 * layout.tsx wrote before first paint; this provider is the place that
 * changes it, so the <html> attributes, localStorage and the store can never
 * disagree.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useRuntime((s) => s.theme);
  const accent = useRuntime((s) => s.accent);
  const motion = useRuntime((s) => s.motion);

  // Each update decides its direction when it runs, not when the button was
  // pressed. A view transition runs its update a frame or more later, so a
  // second press inside that window used to read the old theme too, and two
  // presses left the page where one would have.
  const toggle = useCallback((origin?: Origin) => {
    withTransition(
      () => {
        const next: Theme = runtime.get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        remember('theme', next);
        runtime.set({ theme: next });
      },
      'theme',
      origin ?? screenCentre(),
    );
  }, []);

  const toggleAccent = useCallback((origin?: Origin) => {
    withTransition(
      () => {
        const next: Accent = runtime.get().accent === 'green' ? 'purple' : 'green';
        document.documentElement.dataset.accent = next;
        remember('accent', next);
        runtime.set({ accent: next });
      },
      // The sword cuts, the wand blooms: the reveal is the discipline taking
      // over. Chosen from the state at the press, which is what the visitor
      // is looking at.
      runtime.get().accent === 'green' ? 'wand' : 'sword',
      origin ?? screenCentre(),
    );
  }, []);

  const toggleStill = useCallback(() => {
    runtime.set({ motion: runtime.get().motion === 'still' ? baseMotion() : 'still' });
  }, []);

  // Decide the motion tier once the intro is over, never during it: the cast
  // is the heaviest thing the page does, and measuring it would demote almost
  // every device. Prologue owns html[data-cast]; without it, measure after load.
  useEffect(() => {
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(detectTier, 2500);
    };
    const afterLoad = () => {
      if (document.readyState === 'complete') arm();
      else window.addEventListener('load', arm, { once: true });
    };
    const onPhase = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== 'done') return;
      window.removeEventListener('cast:phase', onPhase);
      afterLoad();
    };

    const cast = document.documentElement.dataset.cast;
    if (!cast || cast === 'done') afterLoad();
    else window.addEventListener('cast:phase', onPhase);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('load', arm);
      window.removeEventListener('cast:phase', onPhase);
    };
  }, []);

  const value = useMemo(
    () => ({ theme, accent, motion, toggle, toggleAccent, toggleStill }),
    [theme, accent, motion, toggle, toggleAccent, toggleStill],
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* Under 静, framer drops transform and layout animations the same way
          it does for a system reduced-motion preference. */}
      <MotionConfig reducedMotion={motion === 'still' ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </ThemeContext.Provider>
  );
}
