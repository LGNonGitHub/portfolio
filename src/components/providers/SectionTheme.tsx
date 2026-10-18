'use client';

import { useEffect } from 'react';
import { runtime, type SectionId } from '@/lib/runtime';

/**
 * The one section observer on the site.
 *
 * It watches which section holds the viewport's centre line and publishes it
 * three ways: `data-section` on <html> (the fixed chrome's palette, which the
 * registered @property channels crossfade over 700 ms), the runtime store
 * (nav pill, telemetry, theme-color, the GL stage), and a 'section:change'
 * event for anything that would rather listen than subscribe. Telemetry used
 * to run a second observer of its own; two observers can and did disagree.
 *
 * `rootMargin: -50% 0px -50% 0px` collapses the observer root to a single
 * horizontal line through the middle of the viewport, so exactly one section
 * can be intersecting at a time. Scrolling through a gap between sections
 * leaves the last palette in place rather than flashing back to the default.
 * Above #work is the prologue: the hero, with no data-section at all.
 */
const SECTIONS = ['work', 'about', 'stack', 'path', 'hobby', 'contact'] as const;

export function SectionTheme() {
  useEffect(() => {
    const root = document.documentElement;
    let current: SectionId | null = null;

    const commit = (section: SectionId) => {
      if (section === current) return;
      current = section;
      if (section === 'prologue') root.removeAttribute('data-section');
      else root.dataset.section = section;
      runtime.set({ section });
      window.dispatchEvent(new CustomEvent('section:change', { detail: { section } }));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as SectionId;
          if (entry.isIntersecting) {
            commit(id);
          } else if (
            id === 'work' &&
            entry.boundingClientRect.top > window.innerHeight / 2
          ) {
            // #work dropped below the centre line: we are back on the hero.
            commit('prologue');
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );

    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    /** Which section the centre line is in right now, by geometry. */
    const underCentre = (): SectionId | null => {
      const line = window.innerHeight / 2;
      for (const id of SECTIONS) {
        const r = document.getElementById(id)?.getBoundingClientRect();
        if (r && r.top <= line && r.bottom > line) return id;
      }
      return null;
    };

    // The observer only fires on crossings, so a fast flick to the top could
    // leave the last section's palette behind: near the top it is always the
    // prologue. The second branch covers the opposite seam. With a hero only
    // one screen tall, #work crosses the centre line while scrollY is still
    // under 0.6 of a screen; the top rule then overrules it, and the observer
    // will not fire again until #work leaves. Without a re-check the whole of
    // Work would scroll by in the hero's colours.
    const onScroll = () => {
      if (window.scrollY < window.innerHeight * 0.6) commit('prologue');
      else if (current === 'prologue') {
        const hit = underCentre();
        if (hit) commit(hit);
      }
    };
    onScroll();
    if (current === null) commit('prologue');
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      root.removeAttribute('data-section');
      runtime.set({ section: 'prologue' });
    };
  }, []);

  return null;
}
