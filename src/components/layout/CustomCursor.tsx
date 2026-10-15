'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsTouch, useReducedMotion } from '@/hooks/useMediaQuery';

type CursorState = 'default' | 'hover' | 'view' | 'drag' | 'text';

/**
 * A two-part cursor: a small solid dot that tracks the pointer exactly, and a
 * larger ring that trails behind it. Elements opt into states with
 * `data-cursor="view" | "drag" | "text"`.
 *
 * Stands down entirely on touch devices and under reduced-motion.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>('default');
  const [visible, setVisible] = useState(false);
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const enabled = !isTouch && !reduced;

  useEffect(() => {
    if (!enabled) {
      document.body.removeAttribute('data-cursor');
      return;
    }
    document.body.setAttribute('data-cursor', 'on');
    return () => document.body.removeAttribute('data-cursor');
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: pos.x, y: pos.y };
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) setVisible(true);

      const el = (e.target as HTMLElement)?.closest?.(
        '[data-cursor-state], a, button, input, textarea, select, [role="button"]',
      ) as HTMLElement | null;

      if (!el) {
        setState('default');
        return;
      }
      const declared = el.dataset.cursorState as CursorState | undefined;
      if (declared) {
        setState(declared);
      } else if (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA'
      ) {
        setState('text');
      } else {
        setState('hover');
      }
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    // Clicking can open a dialog over the element we were tracking, which would
    // otherwise leave the ring stuck mid-state until the next move.
    const onDown = () => setState('default');

    const render = () => {
      // The dot is exact; the ring lerps toward it for a trailing feel.
      ring.x += (pos.x - ring.x) * 0.16;
      ring.y += (pos.y - ring.y) * 0.16;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
    };
  }, [enabled, visible]);

  if (!enabled) return null;

  const ringSize =
    state === 'view' ? 88 : state === 'drag' ? 72 : state === 'hover' ? 52 : 34;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 240ms ease' }}
    >
      <div
        ref={ringRef}
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border border-fg/40 transition-[width,height,background-color,border-color] duration-300 ease-expo"
        style={{
          width: ringSize,
          height: ringSize,
          mixBlendMode: 'difference',
          backgroundColor:
            state === 'view' || state === 'drag'
              ? 'rgb(var(--accent))'
              : 'transparent',
          borderColor:
            state === 'view' || state === 'drag'
              ? 'transparent'
              : 'rgb(var(--fg) / 0.4)',
        }}
      >
        <span
          className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-accent-ink transition-opacity duration-200"
          style={{ opacity: state === 'view' || state === 'drag' ? 1 : 0 }}
        >
          {state === 'view' ? 'View' : state === 'drag' ? 'Drag' : ''}
        </span>
      </div>

      <div
        ref={dotRef}
        className="absolute left-0 top-0 rounded-full bg-fg transition-opacity duration-200"
        style={{
          width: 5,
          height: 5,
          mixBlendMode: 'difference',
          opacity: state === 'view' || state === 'drag' ? 0 : 1,
        }}
      />
    </div>
  );
}
