'use client';

import { useEffect } from 'react';

/**
 * Each of the five scroll sections owns a colour pair. This watches which one
 * holds the viewport's centre line and writes it to `data-section` on <html>;
 * the CSS in globals.css does the rest, and the registered @property channels
 * interpolate so the whole page crossfades between palettes.
 *
 * `rootMargin: -50% 0px -50% 0px` collapses the observer root to a single
 * horizontal line through the middle of the viewport, so exactly one section
 * can be intersecting at a time. Scrolling through a gap between sections
 * leaves the last palette in place rather than flashing back to the default,
 * which is what you want — the hero and footer simply keep whatever is nearest.
 */
const SECTIONS = ['work', 'about', 'stack', 'path', 'hobby', 'contact'] as const;

export function SectionTheme() {
  useEffect(() => {
    const root = document.documentElement;

    // The hero sits above #work, so start on the default pair.
    const clearIfAtTop = () => {
      if (window.scrollY < window.innerHeight * 0.6) {
        root.removeAttribute('data-section');
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            root.dataset.section = entry.target.id;
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );

    const observed: Element[] = [];
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        observed.push(el);
      }
    }

    clearIfAtTop();
    window.addEventListener('scroll', clearIfAtTop, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', clearIfAtTop);
      root.removeAttribute('data-section');
    };
  }, []);

  return null;
}
