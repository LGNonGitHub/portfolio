'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type Theme = 'light' | 'dark';
/** Which half of the duality leads: green (sword/design) or purple (wand/code). */
type Accent = 'green' | 'purple';

const ThemeContext = createContext<{
  theme: Theme;
  accent: Accent;
  toggle: () => void;
  toggleAccent: () => void;
}>({
  theme: 'dark',
  accent: 'green',
  toggle: () => {},
  toggleAccent: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Defaults match the inline script in layout.tsx so first paint agrees.
  const [theme, setTheme] = useState<Theme>('dark');
  const [accent, setAccent] = useState<Accent>('green');

  useEffect(() => {
    const root = document.documentElement;
    setTheme((root.dataset.theme as Theme) || 'dark');
    setAccent((root.dataset.accent as Accent) || 'green');
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {
        /* storage can be blocked — the theme still applies for this session */
      }
      return next;
    });
  }, []);

  const toggleAccent = useCallback(() => {
    setAccent((prev) => {
      const next: Accent = prev === 'green' ? 'purple' : 'green';
      document.documentElement.dataset.accent = next;
      try {
        localStorage.setItem('accent', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, accent, toggle, toggleAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
