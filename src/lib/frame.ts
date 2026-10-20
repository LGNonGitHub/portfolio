/**
 * The frame ticker: one requestAnimationFrame loop for the whole site.
 *
 * Lenis used to run its own loop, the telemetry another, the canvases one
 * each. Several loops on one page drift: a scroll-linked effect can read the
 * scroll position a frame before Lenis writes it, which is the one-frame
 * shimmer you see on badly synced parallax. Here Lenis advances first, then
 * every subscriber runs against the same scroll value, in the same frame.
 *
 * The loop only runs when something is actually moving: while Lenis is still
 * easing, or for a short window after the last real event. Subscribers alone
 * do not keep it alive — several of them (the telemetry depth, the episode
 * bar, the stage director on the full tier) stay mounted for the whole visit,
 * and a phone left on the page was measured still burning ~55 frames a second
 * with nothing to show for them. Under 静 or reduced motion there is no loop
 * at all, and invalidate() paints exactly one frame when something real
 * changes — a scroll, a resize, a palette change.
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

/* How long one event is allowed to keep the loop running. Sized to the
   longest thing a single event starts: the stage's section morph, MORPH_MS
   plus its tail in src/lib/gl/director.ts. Shorter and a morph would freeze
   half-finished on the full tier, where the director never parks itself. */
const ACTIVE_MS = 1600;
/* performance.now() up to which something is still considered to be moving.
   Pushed forward by every real event — scroll, resize, section change, theme
   or motion change, a new subscriber. */
let activeUntil = 0;

const quiet = () =>
  runtime.get().motion === 'still' || Boolean(reducedQuery?.matches);

/* Lenis keeps easing for about a second after the last wheel or touch, and a
   programmatic scrollTo runs longer still; neither may be cut off mid-flight. */
function lenisBusy() {
  if (!lenis) return false;
  return Boolean(lenis.isScrolling) || Math.abs(lenis.velocity) > 0.01;
}

function wantsLoop() {
  if (document.visibilityState !== 'visible') return false;
  // An unfinished scroll outranks everything, 静 included: stillness means no
  // ambient motion, not a scroll that stops halfway down the page.
  if (lenisBusy()) return true;
  if (quiet()) return false;
  return subscribers.size > 0 && performance.now() < activeUntil;
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

  // A subscriber may already have asked for the next frame via invalidate().
  // Scheduling again here would queue two ticks for it, and each of those
  // two more: the callbacks double every frame until the tab locks up.
  if (wantsLoop()) {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  // Going idle: the next burst must not be handed a dt covering the gap.
  else lastTime = 0;
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
  // The input itself has to count, not only the scroll it causes: Lenis
  // preventDefaults the wheel and moves the page from inside this loop, so on
  // a page that has gone idle there would be no scroll event to wake us and
  // the wheel would do nothing at all.
  window.addEventListener('wheel', invalidate, { passive: true });
  window.addEventListener('touchstart', invalidate, { passive: true });
  window.addEventListener('touchmove', invalidate, { passive: true });
  window.addEventListener('keydown', invalidate, { passive: true });
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

/**
 * Something real changed: paint a frame, and let the loop keep running for a
 * moment so whatever that change started can play out. The stamp is taken
 * even when the loop is already running — that is what extends it through a
 * scroll — so this is cheap enough to call from a scroll handler.
 */
export function invalidate() {
  if (typeof window === 'undefined') return;
  init();
  activeUntil = performance.now() + ACTIVE_MS;
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
