'use client';

import { useEffect } from 'react';
import { runtime } from '@/lib/runtime';
import { washHex } from '@/lib/palettes';

/**
 * The browser's own chrome — a phone's address bar, a PWA title bar — takes
 * the colour of the section you are reading: the section wash, the same mix of
 * accent into background the page paints. Scrolling the season on a phone
 * tints the bar crimson, green, violet, cyan, white, pink.
 *
 * This is the only writer of <meta name="theme-color">. layout.tsx server-
 * renders one tag with the dark default so the first paint is already right;
 * this adopts it (or creates one if it is missing) and keeps it in step.
 * It writes only when the runtime store changes — a section, theme or accent
 * change — never per scroll frame, because browsers repaint their chrome on
 * every write.
 */
export function ThemeColor() {
  useEffect(() => {
    const apply = () => {
      const { theme, section, accent } = runtime.get();
      const colour = washHex(theme, section, accent);
      // Re-queried each time rather than cached: a route change may re-render
      // the head, and a cached node could be a detached one.
      const tags = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
      if (tags.length === 0) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = colour;
        document.head.appendChild(meta);
        return;
      }
      tags.forEach((tag) => {
        if (tag.content !== colour) tag.content = colour;
      });
    };
    apply();
    return runtime.subscribe(apply);
  }, []);

  return null;
}
