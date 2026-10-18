/**
 * The frame ticker: one requestAnimationFrame loop for the whole site.
 *
 * Lenis used to run its own loop, the telemetry another, the canvases one
 * each. Several loops on one page drift: a scroll-linked effect can read the
 * scroll position a frame before Lenis writes it, which is the one-frame
 * shimmer you see on badly synced parallax. Here Lenis advances first, then
 * every subscriber runs against the same scroll value, in the same frame.
 *
 * The loop only runs when something needs it: while Lenis exists (it eases
 * between frames), or while there are subscribers and motion is allowed.
 * Under 静 or reduced motion it goes idle, and invalidate() paints exactly one
 * frame when something real changes — a scroll, a resize, a palette change.
 *
 * Rules for subscribers (see README, "Budgets & audit"): use the dt you are
 * given rather than counting frames, so a 120 Hz screen does not run you
 * twice as fast; only write transform/opacity; never call getComputedStyle.
 */
import type Lenis from 'lenis';
import { runtime } from '@/lib/runtime';

export type FrameFn = (timeMs: number, dtMs: number) => void;

const subscribers = new Set<FrameFn>();
let lenis: Lenis | null = null;
let rafId = 0;
let lastTime = 0;
let lastDt = 1000 / 60;
let initialised = false;
let reducedQuery: MediaQueryList | null = null;

/* Velocity without Lenis: sampled from scroll deltas, then decayed lazily on
   read, so a still page reports 0 without needing frames to count it down. */
let sampleY = 0;
let sampleAt = 0;
let sampledVelocity = 0;
const VELOCITY_DECAY_MS = 120;

const quiet = () =>
  runtime.get().motion === 'still' || Boolean(reducedQuery?.matches);

function wantsLoop() {
  if (document.visibilityState !== 'visible') return false;
  if (lenis) return true;
  return subscribers.size > 0 && !quiet();
}

function tick(time: number) {
  rafId = 0;
  const dt = lastTime ? Math.min(50, Math.max(0, time - lastTime)) : 1000 / 60;
  lastTime = time;
  // Floored so a stray double frame cannot divide velocity by ~0.
  if (dt > 0) lastDt = Math.max(4, dt);

  lenis?.raf(time);

  if (!lenis) {
    const y = window.scrollY;
    if (sampleAt && time > sampleAt) {
      sampledVelocity = ((y - sampleY) / (time - sampleAt)) * 1000;
    }
    sampleY = y;
    sampleAt = time;
  }

  subscribers.forEach((fn) => {
    try {
      fn(time, dt);
    } catch (err) {
      // One broken effect must not stop the scroll or every other effect.
      // Rethrown on a microtask so it still reaches the console.
      queueMicrotask(() => {
        throw err;
      });
    }
  });

  if (wantsLoop()) rafId = requestAnimationFrame(tick);
}

/** Start the continuous loop if conditions call for it. */
function ensure() {
  if (!rafId && wantsLoop()) rafId = requestAnimationFrame(tick);
}

function init() {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;
  reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedQuery.addEventListener('change', () => {
    ensure();
    invalidate();
  });
  window.addEventListener('scroll', invalidate, { passive: true });
  window.addEventListener('resize', invalidate);
  window.addEventListener('section:change', invalidate);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Do not hand the first frame back a dt covering the whole absence.
      lastTime = 0;
      ensure();
      invalidate();
    }
  });
  runtime.subscribe(() => {
    ensure();
    invalidate();
  });
}

/** Run fn every frame (or on every invalidated frame when the page is still).
 *  Returns the unsubscribe function. */
export function subscribe(fn: FrameFn) {
  init();
  subscribers.add(fn);
  ensure();
  invalidate();
  return () => {
    subscribers.delete(fn);
  };
}

/** Schedule one frame. A no-op while the loop is already running. */
export function invalidate() {
  if (typeof window === 'undefined') return;
  init();
  if (rafId || document.visibilityState !== 'visible') return;
  rafId = requestAnimationFrame(tick);
}

/** SmoothScroll hands its instance over; Lenis then advances inside this loop. */
export function setLenis(next: Lenis | null) {
  init();
  lenis = next;
  ensure();
  invalidate();
}

export const getLenis = () => lenis;

/** The scroll position effects should use this frame. */
export function scrollY() {
  if (lenis) return lenis.animatedScroll;
  return typeof window === 'undefined' ? 0 : window.scrollY;
}

/**
 * Scroll velocity in px/s, signed (positive is down the page).
 *
 * Lenis reports px per frame, so it is scaled by the measured frame time
 * rather than a fixed 60: on a 120 Hz screen a fixed 60 would halve it.
 */
export function velocity() {
  if (lenis) return lenis.velocity * (1000 / lastDt);
  if (!sampleAt) return 0;
  const idle = performance.now() - sampleAt;
  return sampledVelocity * Math.exp(-Math.max(0, idle) / VELOCITY_DECAY_MS);
}

export type ScrollToOptions = {
  offset?: number;
  duration?: number;
  /** Move keyboard focus to the target when the scroll lands. Default true. */
  focus?: boolean;
};

const NATIVELY_FOCUSABLE =
  'a[href], button, input, select, textarea, summary, iframe, [contenteditable], [tabindex]';

function resolve(target: string | HTMLElement | number): HTMLElement | number | null {
  if (typeof target === 'number') return target;
  if (typeof target !== 'string') return target;
  if (target.startsWith('#')) {
    return document.getElementById(decodeURIComponent(target.slice(1)));
  }
  return document.querySelector<HTMLElement>(target);
}

function focusTarget(el: HTMLElement) {
  if (!el.isConnected) return;
  // Sections and <main> are not controls. tabindex=-1 lets them take focus
  // programmatically without joining the Tab order; globals.css hides the
  // outline for exactly these, since a ring around a whole section is noise.
  if (!el.matches(NATIVELY_FOCUSABLE)) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

/**
 * Scroll to an element, selector or offset, and hand keyboard focus over when
 * it lands — the step a preventDefault()'d anchor otherwise loses, which is
 * why the skip link used to leave focus on itself.
 */
export function scrollTo(
  target: string | HTMLElement | number,
  { offset = -24, duration = 1.4, focus = true }: ScrollToOptions = {},
) {
  if (typeof window === 'undefined') return;
  const resolved = resolve(target);
  if (resolved === null) return;
  const el = typeof resolved === 'number' ? null : resolved;

  let landed = false;
  let fallback = 0;
  const land = () => {
    if (landed) return;
    landed = true;
    clearTimeout(fallback);
    if (focus !== false && el) focusTarget(el);
  };

  if (lenis) {
    // force: an anchor is a deliberate request, and must not be swallowed
    // because an overlay happened to have Lenis stopped at that moment.
    lenis.scrollTo(resolved, { offset, duration, force: true, onComplete: land });
    // A wheel or touch mid-flight cancels the ease and Lenis never calls
    // onComplete; focus still has to arrive or the next Tab goes back to the nav.
    fallback = window.setTimeout(land, duration * 1000 + 400);
  } else {
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    else window.scrollTo({ top: Math.max(0, (resolved as number) + offset), behavior: 'auto' });
    land();
  }
  invalidate();
}
