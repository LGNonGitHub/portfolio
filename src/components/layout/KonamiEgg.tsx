'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/**
 * Konami code → a short "wireframe mode" that outlines every element on the
 * page. Harmless, undocumented, and the kind of thing people screenshot.
 */
export function KonamiEgg() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let position = 0;

    const onKey = (e: KeyboardEvent) => {
      // Ignore while typing in the contact form.
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const expected = SEQUENCE[position];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === expected) {
        position += 1;
        if (position === SEQUENCE.length) {
          position = 0;
          setActive((a) => !a);
        }
      } else {
        // Allow a wrong key to be the start of a fresh attempt.
        position = key === SEQUENCE[0] ? 1 : 0;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const id = 'konami-wireframe';
    const existing = document.getElementById(id);

    if (active && !existing) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        *:not(html):not(body) {
          outline: 1px solid rgb(var(--accent) / 0.55) !important;
          outline-offset: -1px;
        }
      `;
      document.head.appendChild(style);
    } else if (!active && existing) {
      existing.remove();
    }

    return () => document.getElementById(id)?.remove();
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed bottom-5 left-1/2 z-[9996] -translate-x-1/2 rounded-full border border-accent/40 bg-bg/90 px-5 py-2.5 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          role="status"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Wireframe mode — ↑↑↓↓←→←→BA to exit
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
