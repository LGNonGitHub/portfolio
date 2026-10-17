'use client';

import { useEffect, useRef } from 'react';
import { subscribe } from '@/lib/frame';

/** Gap between the control and the brackets. */
const PAD = 4;
/** On first appearance the brackets start this much wider and close in. */
const LOCK_FROM = 10;
/** Matches the 120 ms transition in palettes.css. */
const SNAP_MS = 120;

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;

/**
 * Keyboard focus, drawn as a HUD target-lock: four corner brackets snap onto
 * whatever Tab lands on, in the colour of that control's own section.
 *
 * It adds to the native focus outline (which stays) and never replaces it.
 * It is keyboard-only by construction: it appears only when the browser
 * decides focus should be visible, vanishes on any pointer press, and is
 * never positioned from the pointer, so it cannot become a cursor.
 */
export function FocusReticle() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;

    let target: HTMLElement | null = null;
    let unfollow: (() => void) | null = null;
    let snapTimer = 0;
    let last = '';

    const hide = () => {
      target = null;
      box.dataset.state = 'off';
      unfollow?.();
      unfollow = null;
    };

    /** Follows the control every frame while focused (scroll, layout shifts),
     *  but only writes when its rect actually moved. */
    const place = (spread = PAD) => {
      if (!target) return;
      const r = target.getBoundingClientRect();
      if (!target.isConnected || (r.width === 0 && r.height === 0)) {
        hide();
        return;
      }
      const x = Math.round((r.left - spread) * 2) / 2;
      const y = Math.round((r.top - spread) * 2) / 2;
      const w = Math.round((r.width + spread * 2) * 2) / 2;
      const h = Math.round((r.height + spread * 2) * 2) / 2;
      const key = `${x}|${y}|${w}|${h}`;
      if (key === last) return;
      last = key;
      box.style.transform = `translate3d(${x}px,${y}px,0)`;
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
    };

    /** Animate the next placement, then go back to following with no lag. */
    const snap = () => {
      box.setAttribute('data-snap', '');
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => box.removeAttribute('data-snap'), SNAP_MS + 20);
    };

    const show = (el: HTMLElement) => {
      const appearing = target === null;
      target = el;

      // Brackets in the control's own section colour, not the chrome's.
      const scope = el.closest<HTMLElement>('[data-palette]')?.dataset.palette;
      if (scope) box.dataset.palette = scope;
      else delete box.dataset.palette;

      if (appearing) {
        // Start open, without a transition, then close in: the lock-on.
        box.removeAttribute('data-snap');
        last = '';
        place(PAD + LOCK_FROM);
        void box.offsetWidth;
      }
      box.dataset.state = 'on';
      snap();
      last = '';
      place(PAD);
      unfollow ??= subscribe(() => place());
    };

    const onFocusIn = () => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement) || el === document.body) return hide();
      // Sections and <main> take focus programmatically after an anchor jump;
      // they are not controls, and globals.css hides their outline too.
      if (el.getAttribute('tabindex') === '-1') return hide();
      if (!el.matches(':focus-visible')) return hide();
      show(el);
    };
    // Moving between controls fires focusout with the next one as
    // relatedTarget, then focusin; only a real exit (to the window, to
    // nothing) hides here.
    const onFocusOut = (e: FocusEvent) => {
      if (!e.relatedTarget) hide();
    };
    const onPointerDown = () => hide();

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.clearTimeout(snapTimer);
      unfollow?.();
    };
  }, []);

  return (
    <div ref={ref} aria-hidden data-focus-reticle="" data-state="off">
      {CORNERS.map((c) => (
        <span key={c} data-corner={c} />
      ))}
    </div>
  );
}
