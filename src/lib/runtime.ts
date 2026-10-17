/**
 * The runtime store: one place that knows which section you are in, which
 * theme and accent lead, and how much motion this visit gets.
 *
 * Before this, three components each ran their own IntersectionObserver, two
 * canvases polled <html> with MutationObserver + getComputedStyle (and were
 * measured running one palette behind), and three clocks ticked at 1 Hz.
 * Everything now reads from here, and React reads it through
 * useSyncExternalStore (src/hooks/useRuntime.ts), so there is no provider to
 * thread and no re-render unless the slice you selected actually changed.
 *
 * Deliberately React-free: the frame ticker, the GL stage and plain DOM code
 * can all subscribe without pulling in a hook.
 */
import { site } from '@/lib/content';
import { formatTime } from '@/lib/utils';

export type SectionId =
  | 'prologue'
  | 'work'
  | 'about'
  | 'stack'
  | 'path'
  | 'hobby'
  | 'contact';

/**
 * full  — everything runs.
 * lite  — chosen once per visit for slow devices: ambient work thins out.
 * still — the visitor pressed 静: ambient loops pause, nothing drifts.
 */
export type Motion = 'full' | 'lite' | 'still';
export type Theme = 'dark' | 'light';
export type Accent = 'green' | 'purple';

export type State = {
  section: SectionId;
  theme: Theme;
  accent: Accent;
  motion: Motion;
};

export const SECTION_IDS = [
  'prologue',
  'work',
  'about',
  'stack',
  'path',
  'hobby',
  'contact',
] as const satisfies readonly SectionId[];

export const isSectionId = (v: unknown): v is SectionId =>
  typeof v === 'string' && (SECTION_IDS as readonly string[]).includes(v);

/** What the server renders with. Matches the SSR <html> attributes in layout.tsx. */
export const SERVER_DEFAULT: State = Object.freeze({
  section: 'prologue',
  theme: 'dark',
  accent: 'green',
  motion: 'full',
});

const isBrowser = typeof window !== 'undefined';

let state: State | null = null;
/** What the device can carry. 'still' is a choice layered over it, so leaving
 *  静 returns to the tier the device earned rather than always to 'full'. */
let tier: 'full' | 'lite' = 'full';
const listeners = new Set<() => void>();

/** The inline theme script has already written the visitor's stored choices
 *  onto <html> before first paint; seed from there so the store and the
 *  painted page can never disagree. */
function seed(): State {
  const d = document.documentElement.dataset;
  if (d.motion === 'lite') tier = 'lite';
  return {
    section: isSectionId(d.section) ? d.section : 'prologue',
    theme: d.theme === 'light' ? 'light' : 'dark',
    accent: d.accent === 'purple' ? 'purple' : 'green',
    motion: d.motion === 'still' ? 'still' : d.motion === 'lite' ? 'lite' : 'full',
  };
}

/** html[data-motion] carries 'still' or 'lite' for CSS; 'full' is the absence
 *  of the attribute, so the SSR markup never has to guess. Only 'still' is
 *  remembered — it is a preference. 'lite' is a measurement of this visit. */
function mirrorMotion(next: Motion, prev: Motion) {
  const root = document.documentElement;
  if (next === 'full') root.removeAttribute('data-motion');
  else root.dataset.motion = next;
  try {
    if (next === 'still') localStorage.setItem('motion', 'still');
    else if (prev === 'still') localStorage.removeItem('motion');
  } catch {
    /* storage can be blocked; stillness still applies for this page */
  }
}

export const runtime = {
  get(): State {
    if (!isBrowser) return SERVER_DEFAULT;
    return (state ??= seed());
  },

  /** Shallow-merges, and only notifies when something actually changed, so a
   *  scroll observer can call this as often as it likes. */
  set(partial: Partial<State>) {
    if (!isBrowser) return;
    const prev = runtime.get();
    let next: State | null = null;
    for (const key of Object.keys(partial) as (keyof State)[]) {
      const value = partial[key];
      if (value === undefined || value === prev[key]) continue;
      next ??= { ...prev };
      (next as Record<keyof State, string>)[key] = value;
    }
    if (!next) return;
    state = next;
    if (next.motion !== prev.motion) mirrorMotion(next.motion, prev.motion);
    listeners.forEach((fn) => fn());
  },

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

/** The motion level to return to when 静 is released. */
export const baseMotion = (): Motion => tier;

/* ── One clock ──────────────────────────────────────────────────────────
   Telemetry and the footer both show IST. They used to run an interval each
   (three, counting the nav's). One interval now feeds every subscriber, starts
   with the first and stops with the last, and is aligned to the wall-clock
   second so the readout never lags the real time by most of a second. */

let clock = '';
let clockTimer = 0;
const clockListeners = new Set<() => void>();

function tickClock() {
  clock = formatTime(new Date(), site.timezone);
  clockListeners.forEach((fn) => fn());
  clockTimer = window.setTimeout(tickClock, 1000 - (Date.now() % 1000) + 8);
}

export function subscribeClock(fn: () => void) {
  clockListeners.add(fn);
  if (clockListeners.size === 1 && isBrowser) tickClock();
  return () => {
    clockListeners.delete(fn);
    if (clockListeners.size === 0) {
      clearTimeout(clockTimer);
      clockTimer = 0;
    }
  };
}

export const getClock = () => clock;

/* ── Tier detection ─────────────────────────────────────────────────────
   Decided once, after the intro has finished, so the cast itself is never
   what gets measured, and never re-run, so a fast device is not demoted by
   one bad second later on. The visitor's 静 always overrides it. */

let tierDecided = false;

export function detectTier() {
  if (!isBrowser || tierDecided) return;
  tierDecided = true;

  // Stillness and reduced motion leave nothing ambient to budget for, and
  // sampling would itself be 90 frames of the work they asked us not to do.
  if (
    runtime.get().motion === 'still' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const demote = () => {
    tier = 'lite';
    if (runtime.get().motion === 'full') runtime.set({ motion: 'lite' });
  };

  const cores = navigator.hardwareConcurrency || 8;
  if (cores <= 4) {
    demote();
    return;
  }

  const deltas: number[] = [];
  let last = 0;
  const sample = (t: number) => {
    if (last) deltas.push(t - last);
    last = t;
    if (deltas.length < 90) {
      requestAnimationFrame(sample);
      return;
    }
    const sorted = deltas.sort((a, b) => a - b);
    // Median, not mean: one GC pause should not cost a device its tier.
    if (sorted[45] > 22) demote();
  };

  const start = () => requestAnimationFrame(sample);
  if (document.visibilityState === 'visible') start();
  else {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onVisible);
      start();
    };
    document.addEventListener('visibilitychange', onVisible);
  }
}
